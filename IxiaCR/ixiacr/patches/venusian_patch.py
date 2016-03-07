import sys
import venusian

# A fixed version of venusian walk_packages so that we can property
# ignore things
def walk_packages(path=None, prefix='', onerror=None, ignore=None):
    """Yields (module_loader, name, ispkg) for all modules recursively
    on path, or, if path is None, all accessible modules.

    'path' should be either None or a list of paths to look for
    modules in.

    'prefix' is a string to output on the front of every module name
    on output.

    Note that this function must import all *packages* (NOT all
    modules!) on the given path, in order to access the __path__
    attribute to find submodules.

    'onerror' is a function which gets called with one argument (the name of
    the package which was being imported) if any exception occurs while
    trying to import a package.  If no onerror function is supplied, any
    exception is exceptions propagated, terminating the search.

    'ignore' is a function fed a fullly dotted name; if it returns True, the
    object is skipped and not returned in results (and if it's a package it's
    not imported).

    Examples:

    # list all modules python can access
    walk_packages()

    # list all submodules of ctypes
    walk_packages(ctypes.__path__, ctypes.__name__+'.')

    # NB: we can't just use pkgutils.walk_packages because we need to ignore
    # things
    """
    def seen(p, m={}):
        if p in m: # pragma: no cover
            return True
        m[p] = True

    # iter_modules is nonrecursive
    for importer, name, ispkg in venusian.iter_modules(path, prefix):

        if ignore is not None and ignore(name):
            # if name is a package, ignoring here will cause
            # all subpackages and submodules to be ignored too
            continue

        # do any onerror handling before yielding

        if ispkg:
            try:
                __import__(name)
            except Exception:
                if onerror is not None:
                    onerror(name)
                else:
                    raise
            else:
                yield importer, name, ispkg
                path = getattr(sys.modules[name], '__path__', None) or []

                # don't traverse path items we've seen before
                path = [p for p in path if not seen(p)]

                for item in walk_packages(path, name+'.', onerror, ignore):
                    yield item
        else:
            yield importer, name, ispkg
