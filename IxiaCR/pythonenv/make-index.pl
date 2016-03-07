#!/usr/bin/perl

opendir( my $dir, "packages" );
my %links = ();
while ( my $file = readdir($dir) ) {
    next if ( $file eq "." || $file eq ".." );

    $basename = $file;
    $basename =~ s/\.tar\.gz$//go;
    $basename =~ s/-py\d+.\d+\.egg$//go;
    $basename =~ s/\.egg$//go;
    $basename =~ s/\.zip$//go;

    $basename =~ s/^(.*)-.+$/\1/o;

    $links{$basename} = $file;
    $links{ lc $basename } = $file;

    $basename =~ s/^python[-_]//gio;
    $links{$basename} = $file;
    $links{ lc $basename } = $file;

    #print "file = $file => $basename\n";
}

system("rm -rf newlinks");
system( "mkdir", "-p", "newlinks" );
foreach my $link ( sort keys(%links) ) {
    my $file = $links{$link};
    print "$link => $file\n";

    mkdir( "newlinks/$link" );
    open( my $out, ">newlinks/$link/index.html" );
    print $out "<a href=\"../../packages/$file\">$file</a>\n";
    close($out);
}

system( "rsync", "-aW", "--force", "--delete", "newlinks/", "links/" );
system( "rm", "-rf", "newlinks" );
