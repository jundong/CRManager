default:
	component build

install: components
	component install

test:
	component install --dev
	component build --dev

clean:
	rm -rf components build

.PHONY: test