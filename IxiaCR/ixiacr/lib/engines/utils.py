import fractions
import ipaddr
import time


class AbstractWeightGenerator(object):
    """
    Abstract class that provides a generator interface for dealing with weights
    """

    def __init__(self, weights):
        self.idx = 0
        self.weights = list()
        self.totalWeight = AbstractWeightGenerator._as_fraction(0)

        for weight in map(AbstractWeightGenerator._as_fraction, weights):
            self.totalWeight += weight
            self.weights.append(weight)

    def __iter__(self):
        return self

    def next(self):
        raise NotImplementedError()

    @staticmethod
    def _as_fraction(num):
        f = None
        if isinstance(num, float):
            f = fractions.Fraction.from_float(num).limit_denominator()
        elif isinstance(num, int) or isinstance(num, long):
            f = fractions.Fraction(num, 1)
        else:
            raise TypeError('Unsupported type: %s' % num)

        return f


class WeightedLoadGenerator(AbstractWeightGenerator):
    """
    Takes a list of weights and a definite load as input.  Generates
    weighted load values as floats
    Note: This implementation uses fractions to maintain precision
    """

    def __init__(self, weights, load):
        super(WeightedLoadGenerator, self).__init__(weights)
        self.load = AbstractWeightGenerator._as_fraction(load)

    def next(self):
        if self.idx == len(self.weights):
            raise StopIteration()
        else:
            weightedLoad = (self.weights.__getitem__(self.idx) / self.totalWeight) * self.load
            weightedFloatLoad = float(weightedLoad.numerator) / weightedLoad.denominator
            self.idx += 1

            return weightedFloatLoad


class WeightedSimplestFormGenerator(AbstractWeightGenerator):
    """
    Converts a list of weights into simplest form by reducing by
    the Greatest Common Denominator
    """

    def __init__(self, weights):
        super(WeightedSimplestFormGenerator, self).__init__(weights)

        # We need to find the GCD of our weights
        self.gcd = WeightedSimplestFormGenerator._gcd(self.weights)

    def next(self):
        if self.idx == len(self.weights):
            raise StopIteration()
        else:
            simpleWeight = self.weights.__getitem__(self.idx) / self.gcd
            self.idx += 1

            # For monitoring purposes... I don't think this will be false
            assert simpleWeight.denominator == 1, 'Cannot simplify weights: %s' % self.weights

            return int(simpleWeight)

    @staticmethod
    def _gcd(nums):
        count = len(nums)
        if count == 1:
            return nums[0]
        elif count == 2:
            return fractions.gcd(nums[0], nums[1])
        else:
            return fractions.gcd(nums[0], WeightedSimplestFormGenerator._gcd(nums[1:]))


class IpAddressGenerator(object):
    IPV4_MAX = ipaddr.IPAddress('255.255.255.255')
    IPV6_MAX = ipaddr.IPAddress('FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF')

    def __init__(self, start, stop=None, step=None, limit=None):
        self.start = ipaddr.IPAddress(start)
        self.limit = limit
        self.is_max = False

        if stop is None:
            self.stop = self.start
        else:
            self.stop = ipaddr.IPAddress(stop)

        if step is None:
            self.step = 1
        else:
            self.step = int(step)

        # Sanity checking
        if self.start.version != self.stop.version:
            raise ValueError('%s and %s are not the same IP version' % (start, stop))

        # Fix possible order issues
        if self.start > self.stop and self.step > 0:
            self.step = self.step * (-1)

        self.idx = 0

    def __iter__(self):
        return self

    def next(self):
        if self.is_max:
            raise StopIteration()

        if (self.start == IpAddressGenerator.IPV4_MAX or
            self.start == IpAddressGenerator.IPV6_MAX):
            self.is_max = True
            return self.start

        cur_ip = self.start + (self.step * self.idx)
        self.idx += 1

        if self.limit and self.idx > self.limit:
            raise StopIteration()
        elif self.step > 0 and cur_ip > self.stop:
            raise StopIteration()
        elif self.step < 0 and cur_ip < self.stop:
            raise StopIteration()
        else:
            return cur_ip


class RateMonitor(object):
    """
    Report the rate that trigger is called every period
    """

    def __init__(self, logger, period=None):
        if not period:
            self._period = 30
        else:
            self._period = period

        self._logger = logger
        self._trigger_count = 0
        self._period_start = time.time()

    def trigger(self):
        now = time.time()
        delta = now - self._period_start
        if delta > self._period:
            self._logger.info('%d triggers in %d seconds (%.3f triggers/sec)' %
                              (self._trigger_count, delta,
                               self._trigger_count / delta))
            self._period_start = now
            self._trigger_count = 0

        self._trigger_count += 1