use Getopt::Long;
use Sys::Syslog;
use Fcntl qw(:flock);

# Set path so it's always available
$ENV{PATH} = "/usr/pgsql-9.1/bin:/sbin:/bin:/usr/sbin:/usr/bin";

# Cannot use yet, leave here as reminder for future though
#use strict;

my $max_progress       = 0;
my @tempfiles_to_purge = ();
our $pretty                     = 0;
our $help                       = 0;
our $default                    = 0;
our $json_trace_silenced_notice = 0;
our $silenced_buffer            = "";

sub root {
    if ( $> != 0 ) {
        my $app = $0;
        if ( $app !~ m|/|o ) {
            $app = "./" . $app;
        }
        exec( "/usr/bin/sudo", $app, @ARGV );
        syslog( "info", "unable to re-exec self" );
        die "Unable to re-exec self.";
        exit(1);
    }
}

sub run_cmd_merge {
    my @cmd = @_;

    my $in;
    my $pid = open( my $in, "-|" );
    if ( !$pid ) {
        open( STDERR, ">&STDOUT" );
        close(STDIN);
        exec(@cmd);
        exit(0);
    }
    while ( defined( my $line = <$in> ) ) {
        print $line;
    }
    close($in);
}

sub capture_cmd_merge {
    my @cmd = @_;
    my @log;

    my $in;
    my $pid = open( my $in, "-|" );
    if ( !$pid ) {
        open( STDERR, ">&STDOUT" );
        close(STDIN);
        exec(@cmd);
        exit(0);
    }
    while ( defined( my $line = <$in> ) ) {
        chomp($line);
        push( @log, $line );
    }
    close($in);

    return @log;
}

sub run_cmd_silent {
    my @cmd = @_;
    my @log;

    my $in;
    my $pid = open( my $in, "-|" );
    if ( !$pid ) {
        open( STDERR, ">/dev/null" );
        open( STDOUT, ">/dev/null" );
        close(STDIN);
        exec(@cmd);
        exit(0);
    }
    close($in);
}

sub silence_json_trace {
    $ENV{SILENCE_JSON_TRACE} = 1;
}

sub unsilence_json_trace {
    syslog( "debug", "JSON Buffered Start" );
    foreach my $line ( split( /\n/, $silenced_buffer ) ) {
        syslog( "debug", "%s", $line );
    }
    syslog( "debug", "JSON Buffered End" );
    undef $silenced_buffer;
    delete $ENV{SILENCE_JSON_TRACE};
}

sub read_chassis_file {
    my $filename = shift;

    my $in = &open_cmd_merge( "/usr/bin/ssh", "-F" => "/local/admin/files/ssh_config", "hypervisor", "cat", $filename );
    my $file_data = join( "", <$in> );
    close($in);

    return $file_data;
}

sub open_cmd_merge {
    my @cmd = @_;

    my $in;
    my $pid = open( my $in, "-|" );
    if ( !$pid ) {
        open( STDERR, ">&STDOUT" );
        close(STDIN);
        exec(@cmd);
        exit(0);
    }
    return $in;
}

sub open_cmd_hide {
    my @cmd = @_;

    my $in;
    my $pid = open( my $in, "-|" );
    if ( !$pid ) {
        open( STDERR, ">/dev/null" );
        close(STDIN);
        exec(@cmd);
        exit(0);
    }
    return $in;
}

sub jsonout {
    my $var = shift @_;

    eval "use JSON";
    my $json = new JSON;

    $json->canonical(1);

    if ($pretty) {
        return $json->pretty->encode($var);
    }
    else {
        return $json->encode($var);
    }
}

sub jsonpretty {
    my $var = shift @_;

    eval "use JSON";
    my $json = new JSON;

    $json->canonical(1);
    return $json->pretty->encode($var);
}

sub tempfile {
    my $tf = "/tmp/admin-helper-" . time . "-" . $$ . ".tmp";
    unlink($tf);

    push( @tempfiles_to_purge, $tf );
    return $tf;
}

sub purge_tempfiles {
    foreach my $tf (@tempfiles_to_purge) {
        system( "/usr/bin/sudo", "/bin/rm", "-rf", $tf );
    }
    @tempfiles_to_purge = ();
}

sub finishlog {
    if (@_) {
        syslog( "info", @_ );
    }
    else {
        syslog( "info", "finished" );
    }
}

sub toolinit {
    my %init_opts = @_;

    Getopt::Long::Configure("pass_through");
    GetOptions(
        "help|h"    => \$help,
        "example|e" => \$example,
        "default|d" => \$default,
        "pretty|p"  => \$pretty,
    );

    # Check for request for help
    if ( $help || $example ) {
        system( "/usr/bin/pod2text", $0 );
        exit(0);
    }

    my $label = $0;
    $label =~ s|.*/||go;

    openlog( $label, "pid,ndelay" );

    syslog( "info", "starting" );

    # Global
    $in_data = {};
    $res     = {};

    if ( !$init_opts{install_safe} ) {
        if ( &install_running() ) {
            &fail("skipping execution, helper not safe/functional during VM build process");
        }
    }
}

sub init {
    my %init_opts = @_;

    Getopt::Long::Configure("pass_through");
    GetOptions(
        "help|h"    => \$help,
        "example|e" => \$example,
        "default|d" => \$default,
        "pretty|p"  => \$pretty,
    );

    # Check for request for help
    if ($help) {
        system( "/usr/bin/pod2text", $0 );
        exit(0);
    }

    # Extract just the INPUT JSON section
    if ($example) {
        open( my $in, "-|" ) || exec( "/usr/bin/pod2text", $0 );
        my $pod = join( "", <$in> );
        close($in);
        $pod =~ s|.*INPUT JSON\s*||sgmo;
        $pod =~ s|\s*OUTPUT JSON.*||sgmo;
        print $pod, "\n";
        exit(0);
    }

    my $label = $0;
    $label =~ s|.*/||go;

    openlog( $label, "pid,ndelay" );

    syslog( "info", "starting" );

    # Global
    $in_data = {};
    $res     = {};

    if ( !$init_opts{install_safe} ) {
        if ( &install_running() ) {
            &fail("skipping execution, helper not safe/functional during VM build process");
        }
    }

    if ($default) {
        &detail("helper using null default input for ($0)");
    }
    else {
        my $in_json;
        eval "use JSON";

        &detail("processing input parameters for ($0)");

        eval {
            local $SIG{ALRM} = sub { die "timeout\n"; };
            alarm(5);
            $in_json = join( "", <STDIN> );
            alarm(0);
        };

        if ($@) {
            syslog( "info", "timed out reading input parameters" );
            &fail("timed out reading input parameters for ($0)");
        }

        eval "use JSON";
        my $json_obj = new JSON;
        eval { $in_data = $json_obj->decode($in_json); };

        if ($@) {
            syslog( "info", "failed to parse json input" );
            &fail("failed to parse json input - $@");
        }
    }

    close(STDIN);
    open( STDIN, "</dev/null" );

}

sub strip {
    my $val = shift;

    $val =~ s/^\s*"*\s*//go;
    $val =~ s/\s*"*\s*$//go;

    return $val;
}

sub fail {
    my $msg    = shift;
    my $object = shift;

    &detail("finishing execution of ($0) with status (FAILURE)");

    my $res = {};
    $res->{result} = "FAILURE";

    $res->{message} = $msg;
    if ( !$res->{message} ) {
        $res->{message} = "Unknown Error";
    }
    if ($object) {
        $res->{object} = $object;
    }

    &log_and_print_json($res);
    &purge_tempfiles();

    if ( $ENV{SILENCE_JSON_TRACE} && $silenced_buffer ) {
        syslog( "debug", "JSON Buffered Start" );
        foreach my $line ( split( /\n/, $silenced_buffer ) ) {
            syslog( "debug", "%s", $line );
        }
        syslog( "debug", "JSON Buffered End" );
    }

    syslog( "info", "finished execution with status (%s)", $res->{result} );
    exit(1);
}

sub killfail {
    my $msg    = shift;
    my $object = shift;

    &detail("finishing execution of ($0) with status (FAILURE)");

    my $res = {};
    $res->{result} = "FAILURE";

    $res->{message} = $msg;
    if ( !$res->{message} ) {
        $res->{message} = "Unknown Error";
    }
    if ($object) {
        $res->{object} = $object;
    }

    &log_and_print_json($res);
    &purge_tempfiles();

    if ( $ENV{SILENCE_JSON_TRACE} && $silenced_buffer ) {
        syslog( "debug", "JSON Buffered Start" );
        foreach my $line ( split( /\n/, $silenced_buffer ) ) {
            syslog( "debug", "%s", $line );
        }
        syslog( "debug", "JSON Buffered End" );
    }

    syslog( "info", "finished execution with status (%s)", $res->{result} );
    kill( 9, $$ );
    exit(1);
}

sub data {
    my $chunk = &jsonout( {@_} );
    print STDERR $chunk, "\n";
}

sub detail {
    my $msg = shift;

    if ( $msg ne "" ) {
        my $data = { "detail" => $msg, @_ };
        &log_and_print_json_stderr($data);
    }
}

sub message {
    my $msg = shift;

    &log_and_print_json_stderr( { "message" => $msg, @_ } );
}

sub progress {
    my $pct = shift;

    if ( $pct == 0 ) {
        $max_progress = 0;
    }
    if ( $pct >= $max_progress ) {
        $max_progress = $pct;
    }
    else {

        # Do not output if unchanged percentage
        return;
    }

    if ( $pct < 0 ) {
        $pct = 0;
    }
    if ( $pct > 100 ) {
        $pct = 100;
    }

    &log_and_print_json_stderr( { "progress" => sprintf( "%d", int($pct) ) } );
}

sub subprogress {
    my $start = shift;
    my $end   = shift;

    my $pct   = shift;
    my $delta = 0;

    if ( $pct < 0 ) {
        $pct = 0;
    }
    if ( $pct > 100 ) {
        $pct = 100;
    }

    my $delta = ( $pct / 100 ) * ( $end - $start );

    &progress( $start + $delta );
}

sub finish {

    if ( !$res->{message} ) {
        $res->{message} = "ok";
        if ( $res->{result} ne "SUCCESS" ) {
            $res->{message} = "Unknown Error";
        }
    }

    &detail( "finishing execution of ($0) with status (" . $res->{result} . ")" );

    &log_and_print_json($res);
    &purge_tempfiles();

    syslog( "info", "finished execution with status (%s)", $res->{result} );

    if ( $res->{result} ne "SUCCESS" ) {
        exit(1);
    }
    else {
        exit(0);
    }
}

sub log_and_print_json {
    my $res = shift;

    if ( !$ENV{SILENCE_JSON_TRACE} ) {
        syslog( "debug", "JSON Start" );
        foreach my $line ( split( /[\r\n]/, &jsonpretty($res) ) ) {
            syslog( "debug", "-- %s", $line );
        }
        syslog( "debug", "JSON End" );
    }
    else {
        if ( !$json_trace_silenced++ ) {
            syslog( "debug", "JSON Trace Silenced" );
        }

        $silenced_buffer .= "JSON Start\n";
        foreach my $line ( split( /[\r\n]/, &jsonpretty($res) ) ) {
            $silenced_buffer .= "-- $line\n";
        }
        $silenced_buffer .= "JSON End\n";
    }
    print &jsonout($res), "\n";
}

sub log_and_print_json_stderr {
    my $res = shift;

    if ( !$ENV{SILENCE_JSON_TRACE} ) {
        syslog( "debug", "JSON Start" );
        foreach my $line ( split( /[\r\n]/, &jsonpretty($res) ) ) {
            syslog( "debug", "-- %s", $line );
        }
        syslog( "debug", "JSON End" );
    }
    else {
        if ( !$json_trace_silenced++ ) {
            syslog( "debug", "JSON Trace Silenced" );
        }

        $silenced_buffer .= "JSON Start\n";
        foreach my $line ( split( /[\r\n]/, &jsonpretty($res) ) ) {
            $silenced_buffer .= "-- $line\n";
        }
        $silenced_buffer .= "JSON End\n";
    }
    print STDERR &jsonout($res), "\n";
}

sub get_chassis_free {
    my $free = 0;
    open( my $in, "/usr/bin/ssh -F /local/admin/files/ssh_config hypervisor /bin/df -k /|" );
    while ( defined( my $line = <$in> ) ) {
        my @tmp = split( ' ', $line );
        if ( $tmp[5] eq "/" ) {
            $free = $tmp[3] * 1024;
        }
    }
    close($in);

    return $free;
}

sub get_vm_free {
    my $free = 0;
    open( my $in, "/bin/df -k /|" );
    while ( defined( my $line = <$in> ) ) {
        my @tmp = split( ' ', $line );
        if ( $tmp[5] eq "/" ) {
            $free = $tmp[3] * 1024;
        }
    }
    close($in);

    return $free;
}

sub install_running {
    if ( -e "/VM_BUILD_RUNNING" || $ENV{"PS1"} =~ /anaconda/ || $ENV{PATH} =~ m|/sysimage/| ) {
        return 1;
    }
    return 0;
}

sub is_yum_error {
    my $line = shift;

    if (   $line =~ /ERROR/
        || $line =~ /\[Errno/o
        || $line =~ / is not signed/o
        || $line =~ /Fatal error, run database recovery/o
        || $line =~ /Cannot open Packages index/o
        || $line =~ /CRITICAL:yum/o
        || $line =~ /rpmdb open failed/o
        || $line =~ /Error: Cannot retrieve repository/o )
    {
        if ( $line !~ /already started/ && $line !~ /already exists/ ) {
            return 1;
        }
    }
    return 0;
}

sub gen_ssh_config {
    my $svu = umask(077);

    foreach my $user ( "root", "web", "utility" ) {
        my @pw  = getpwnam($user);
        my $dir = $pw[7];
        my $uid = $pw[2];
        my $gid = $pw[3];

        mkdir( "$dir/.ssh", 0700 );
        chmod( 0700, "$dir/.ssh" );
        chown( $uid, $gid, "$dir", "$dir/.ssh" );

        my $tf = "$dir/.ssh/config_new_$$";
        unlink($tf);

        open( my $in,  "</local/admin/files/ssh_config_min" );
        open( my $out, ">$tf" );
        while ( defined( my $line = <$in> ) ) {
            print $out $line;
        }
        close($out);
        close($in);

        unlink("$dir/.ssh/known_hosts");
        rename( $tf, "$dir/.ssh/config" );

        &run_cmd_silent( "chown", "-R", "$user:$user", "$dir/.ssh" );
    }

    umask($svu);
}

sub gen_ssh_key {
    my ( $type, $path, $name ) = @_;
    my $dir = $path;
    $dir =~ s|^(.*)/(.*?)$|\1|go;

    my $svu = umask(077);

    if ( !-d $dir ) {
        system( "mkdir", "-p", $dir );
    }

    if ( !-f $path ) {

        # Don't use tmp file, we have hard linking elsewhere
        &run_cmd_silent( "ssh-keygen", "-t" => $type, "-f" => $path, "-P" => "", "-C" => $name );
    }

    umask($svu);
}

sub concat_file {
    my ( $fh, $filename ) = @_;

    if ( -e $filename ) {
        open( my $in, "<", $filename );
        while ( defined( my $line = <$in> ) ) {
            print $fh $line;
        }
        close($in);
    }
}

sub get_chassis_id {
    my $in = &open_cmd_merge(
        "/usr/bin/ssh",
        "-F" => "/local/admin/files/ssh_config",
        "hypervisor", "/mnt/chassis-helpers/get-stc-serial"
    );
    chomp( $serial = <$in> );
    close($in);

    if ( $serial =~ /^VDH=.*-.*$/io ) {
        return $serial;
    }
    return undef;
}

sub run_helper {
    my $cmd  = shift;
    my $data = shift;

    my @cmd_and_args;
    if ( ref($cmd) ) {
        @cmd_and_args = @$cmd;
    }
    else {
        @cmd_and_args = ($cmd);
    }
    my $cmd_string = join( " ", @cmd_and_args );

    if ( defined($data) && ref($data) ne "HASH" ) {
        &fail("improper data for run_helper($cmd_string)");
    }

    eval "use JSON";
    my $json = new JSON;

    use IPC::Open3;
    use Symbol 'gensym';
    my $child_stdin  = gensym;
    my $child_stderr = gensym;
    my $child_stdout = gensym;

    alarm(120);
    &detail("launching helper $cmd_string");

    my $pid = open3( $child_stdin, $child_stdout, $child_stderr, @cmd_and_args );
    if ($data) {
        print $child_stdin $json->pretty->encode($data);
    }
    close($child_stdin);
    while ( defined( my $line = <$child_stderr> ) ) {
        print STDERR $line;
        alarm(120);
    }
    my $output = join( "", <$child_stdout> );

    my $resdata;
    eval { $resdata = $json->decode($output); };

    close($child_stdout);
    close($child_stdin);
    close($child_stderr);
    alarm(30);
    waitpid( $pid, 0 );
    alarm(0);

    if ( !$resdata ) {
        &detail( "helper result output (unparseable)", output => $output );
    }
    else {
        &detail( "helper result data", data => $resdata );
    }

    &detail("finished helper $cmd_string");
    return $resdata;
}

sub parse_sh_config {
    my $fh = shift;

    my %opts = ();
    while ( defined( my $line = <$fh> ) ) {
        chomp($line);
        $line =~ s/#(?=[^"]*$).*$//;
        $line =~ s/^\s+//go;
        $line =~ s/\s+$//go;
        next if ( $line =~ /^\s*$/o );
        if ( $line =~ /^(.*?)\s*=\s*(.*?)\s*$/o ) {
            my $k = $1;
            my $v = $2;
            $v =~ s/^"(.*?)"$/$1/o;
            $v =~ s/^'(.*?)'$/$1/o;
            $opts{$k} = $v;
        }
    }

    return %opts;
}

sub is_release_build {
    my $release = 0;
    opendir( my $buildinfo, "/build-info" );
    while ( my $file = readdir($buildinfo) ) {
        if ( $file =~ /-release-/ ) {
            $release++;
            last;
        }
    }
    closedir($buildinfo);

    return $release;
}

sub safe_file_rewrite {
    my ( $file, $content, $mode ) = @_;

    my $txt_in;
    open( my $in, "<$file" );
    my $txt_in = join( "", <$in> );
    close($in);

    if ( !$mode ) {
        my @ts = stat($file);
        if (@ts) {
            $mode = $ts[2] & 07777;
        }
    }

    if ( $content ne $txt_in ) {
        unlink( $file . ".tmp" );
        open( my $out, ">${file}.tmp" );
        print $out $content;
        close($out);
        rename( $file . ".tmp", $file );

        if ($mode) {
            chmod( $mode, $file );
        }

        return 1;
    }
    else {
        return 0;
    }
}

{
    my $timeout_phase = "";

    sub timeout {
        my $maxtime = shift;
        my $phase   = shift;
        if ( !$maxtime ) {
            $maxtime = 60;
        }
        if ($phase) {
            $timeout_phase = $phase;
        }

        $SIG{ALRM} = sub { &killfail( "internal timeout ($timeout_phase)", {} ); };
        alarm($maxtime);
    }

    sub timeout_clear {
        undef $SIG{ALRM};
        alarm(0);
    }

    sub timeout_phase {
        my $timeout_phase = shift;
    }

}

#
# Simple locking mechanism to control helper concurrency
#

{
    my %helper_locks = ();
    my $helper_lastkey;

    sub helper_lock {
        my %opts    = @_;
        my $key     = $opts{key} || "common";
        my $maxtime = $opts{maxtime} || 60;

        $helper_lastkey = $key;

        my $lk;

        my $sv_umask = umask;
        umask(0);
        if ( !$helper_locks{$key} ) {
            open( $lk, ">>/tmp/helper-locks-$key" );
            $helper_locks{$key} = $lk;
        }
        umask($sv_umask);

        my $obtained = 0;
        my $wt_start = time;
        my $loops    = 0;
        &detail("helper_locks: trying for lock ($key)");
        while ( !$obtained ) {
            my $res = flock( $lk, LOCK_EX | LOCK_NB );
            my $elap = time - $wt_start;
            if ( !$res ) {

                # output periodically
                if ( $loops % 20 == 0 ) {
                    if ( $! !~ /Resource temporarily/o ) {
                        &detail("helper_locks: error requesting lock ($key) - $!");
                    }
                    &detail("helper_locks: waiting for lock ($key) - $elap elapsed");
                }
                $loops++;
                select( undef, undef, undef, 0.05 );
                last if ( $elap > $maxtime );
            }
            else {
                $obtained = 1;
            }
        }

        if ( !$obtained ) {
            &detail("helper_locks: unable to obtain lock ($key)");
            return 0;
        }
        else {
            &detail("helper_locks: obtained lock ($key)");
            return 1;
        }
    }

    sub helper_unlock {
        my %opts = @_;
        my $key = $opts{key} || $helper_lastkey;

        if ( $helper_locks{$key} ) {
            &detail("helper_locks: releasing lock ($key)");
            close( $helper_locks{$key} );
            delete $helper_locks{$key};
        }
        else {
            &detail("helper_locks: unable to release lock ($key)");
        }
    }

}

sub daemonize {
    if (fork) {

        # Parent - connected to caller
        if ( !$res ) {
            $res = {};
        }

        if ( !$res->{result} ) {
            $res->{result} = "SUCCESS";
            $res->{object} = {};
        }

        &finish();
        exit(1);
    }

    closelog();

    close(STDIN);
    close(STDOUT);
    close(STDERR);

    if (fork) {

        # parent of second fork, child of first
        exit;
    }

    # dissassociate from everything else
    setpgrp( 0, 0 );

    my $label = $0;
    $label =~ s|.*/||go;

    openlog( $label, "pid,ndelay" );

    syslog( "info", "starting (background)" );
}

# Convert to iso 8601: 2014-07-13T18:02:49Z  or  2014-07-13T18:02:49.000Z
sub tstamp_ms_to_iso {
    my $ts_ms = shift;

    my $ts = int( $ts_ms / 1000 );
    my $ms = $ts_ms % 1000;

    my @gm = gmtime($ts);
    my $iso = sprintf( "%.4d-%.2d-%.2dT%.2d:%.2d:%.2d.%.3dZ", $gm[5] + 1900, $gm[4] + 1, $gm[3], $gm[2], $gm[1], $gm[0],
        $ms );
    return $iso;
}

1;

