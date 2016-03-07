default: node_modules dev
	@echo "Dev files built - OK to upload/refresh page"
	@echo "Building production files"
	@(rm -rf tmp-component-build \
		&& mkdir tmp-component-build \
		&& component build -o tmp-component-build \
		&& uglify -s tmp-component-build/build.js -o static/js/build.min.js \
		&& rm -rf tmp-component-build)

node_modules:
	npm install

dev: node_modules
	@component build --dev -o static/js

all: components convert default
	@echo "Done"

convert:
	@for file in `find components-ixia -iregex ".*/templates/.*\.html"`; do \
		echo "Converting $$file"; \
		component convert $$file; \
	done;
	@for file in `find components-ixia -name template.html`; do \
		echo "Converting $$file"; \
		component convert $$file; \
	done;

components: component.json
	component install --dev

extract:
	# Use with https://localise.biz/johntron/ui-translations
	find components-ixia -iname "*.js" | xargs xgettext --from-code=UTF-8 -p ./ui-translations --keyword=translate

test: dev
	mkdir -p static/js/test
	cd components-ixia; \
    for component in *; do \
        if [ -d $$component/test ]; then \
            cd $$component/test; \
            for test in `find . -name *.js`; do \
                mkdir -p ../../../static/js/test/$$component/$${test%/*}; \
                cp $$test ../../../static/js/test/$$component/$$test; \
            done; \
            cd ../../; \
        fi; \
    done; \
    cd ../; \
	#open static/js/test.html

clean:
	rm -fr static/js/test components

targets:
	@echo 'default – compiles Component files'
	@echo 'all – converts HTML templates, installs components, and compiles compoent files'
	@echo 'convert - converts HTML templates to JavaScript files'
	@echo 'components - install components'
	@echo 'extract - generate gettext po file for translation purposes'
	@echo 'test'
	@echo 'clean'
	@echo 'licenses - echo licenses for all components'

licenses:
	grep -R license components/**/component.json | sed -e 's/\/component.json: *"license": "\([^"]*\)",*/: \1/'

.PHONY: default
.PHONY: all
.PHONY: convert
.PHONY: extract
.PHONY: test
.PHONY: clean
.PHONY: licenses
