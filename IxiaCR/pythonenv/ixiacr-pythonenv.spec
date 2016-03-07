## Don't mess with the contents, we're not building from source
#%define __jar_repack 0
#%define __os_install_post %{nil}

# Don't autocalculate provides list
#%define __find_provides %{nil}
#%define __find_requires %{nil}
#%define _use_internal_dependency_generator 0

# So we don't have to do complicated excludes/etc, just explicitly list what we want
#%define _unpackaged_files_terminate_build 0

Name: IxiaCR-pythonenv
Version: 1.0
Release: %{ixiacr_buildnumber}
Summary: Ixia Python Environment
BuildArch: noarch
License: Original
Group: Applications/Ixia
Vendor: Ixia
URL: http://www.ixiacom.com
Provides: ixiacr-pythonenv
Source0: make-index.pl
Source1: pkgs-to-install.txt
Source2: packages
Source3: setup.sh

%{?with_obsoletes:Obsoletes: ixiacr-pythonenv}

# Want supervisor so we get the system startup scripts populated instead of doing ourselves
Requires: supervisor

%description
Do not use these RPMs elsewhere without contacting Enterprise team.

%prep

%build

%install

rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/local/pythonenv/repo
mkdir -p $RPM_BUILD_ROOT/local/pythonenv/repo/packages

# Copy all of the python tarballs/zips from central repo
cp %{SOURCE0} $RPM_BUILD_ROOT/local/pythonenv/repo/make-index.pl
cp %{SOURCE1} $RPM_BUILD_ROOT/local/pythonenv/repo/pkgs-to-install.txt
cp %{SOURCE2}/* $RPM_BUILD_ROOT/local/pythonenv/repo/packages/
cp %{SOURCE3} $RPM_BUILD_ROOT/local/pythonenv/repo/setup.sh

%clean

rm -rf $RPM_BUILD_ROOT

%pre

grep "^web:" /etc/passwd >/dev/null
if [ $? != 0 ]; then
mkdir -p /local/web
adduser -d /local/web web
fi

%post

/local/pythonenv/repo/setup.sh

%postun

%files
%defattr(644,web,web,755)

/local/pythonenv/repo/packages/*

%attr(644,web,web) /local/pythonenv/repo/pkgs-to-install.txt
%attr(755,web,web) /local/pythonenv/repo/make-index.pl
%attr(755,web,web) /local/pythonenv/repo/setup.sh

%changelog
