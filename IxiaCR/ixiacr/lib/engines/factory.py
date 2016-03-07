# ##
# Base Builder Factory
###

class BaseFactory(object):
    """
    SubclassManager is for finding all derived classes of a base class
    """

    def __init__(self, klass):
        self._subclasses = BaseFactory.get_subclasses_for(klass)

    @property
    def subclasses(self):
        return self._subclasses

    @staticmethod
    def get_subclasses_for(klass):
        subclasses = []
        for cls in klass.__subclasses__():
            subclasses.append(cls)

            if len(cls.__subclasses__()):
                subclasses.extend(BaseFactory.get_subclasses_for(cls))

        return subclasses