
build: components index.js interface-selector.css templates
	@component build --dev

templates: templates/*.html
	@component convert $<

components: component.json
	@component install --dev

clean:
	rm -fr build components templates/*.html

.PHONY: clean
