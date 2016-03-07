from ixiacr.tasks import base
from ixiacr.tasks.celery import IxiaCelery

@IxiaCelery.task(name='reset_db_task', base=base.DBTask)
def reset_db_task():
    return reset_db_task.reset_db()

@IxiaCelery.task(name='dump_db_task', base=base.DBTask)
def dump_db_task():
    return dump_db_task.dump_db()

@IxiaCelery.task(name='restore_db_task', base=base.DBTask)
def restore_db_task():
    return restore_db_task.restore_db()

@IxiaCelery.task(name='update_task', base=base.SystemTask)
def update_task(task_id):
    return update_task.update(task_id)

@IxiaCelery.task(name='reboot_task', base=base.SystemTask)
def reboot_task():
    return reboot_task.restart()

@IxiaCelery.task(name='shutdown_task', base=base.SystemTask)
def shutdown_task():
    return shutdown_task.shutdown()