class ObjectIDMap(object):

    _object_map = {
        'DDoS': '1.0',
        'LDAP': '3.49'
    }

    @classmethod
    def get_id_by_object(cls, obj):
        return cls._object_map[obj.todict()['name']]

    @classmethod
    def get_id_by_name(cls, name):
        return cls._object_map[name]