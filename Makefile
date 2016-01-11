BIN := node_modules/.bin
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)
TYPESCRIPT_BASENAMES = $(basename $(TYPESCRIPT))
NODE_ARGS := --use_strict --harmony_default_parameters --harmony_destructuring --harmony_rest_parameters

all: $(TYPESCRIPT_BASENAMES:%=%.js) static/build/site.css static/build/bundle.js .gitignore .npmignore

$(BIN)/tsc $(BIN)/webpack:
	npm install

.gitignore: tsconfig.json
	echo $(TYPESCRIPT_BASENAMES:%=/%.js) /static/build | tr ' ' '\n' > $@

.npmignore: tsconfig.json
	echo $(TYPESCRIPT) Makefile tsconfig.json webpack.config.js | tr ' ' '\n' > $@

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc

%.js: %.tsx $(BIN)/tsc
	$(BIN)/tsc

server: server.js
	node_restarter '**/*.js' '!**/bundle.js' '!node_modules/**/*.js' 'node $(NODE_ARGS) server.js'

dev: webpack.config.js $(BIN)/webpack
	$(BIN)/webpack --watch --config $<

static/build/site.css: webpack.config.js static/site.less
	NODE_ENV=production $(BIN)/webpack --config $<

static/build/bundle.js: webpack.config.js static/app.tsx
	NODE_ENV=production $(BIN)/webpack --config $<

clean:
	rm -f $(TYPESCRIPT_BASENAMES:%=%.d.ts) $(TYPESCRIPT_BASENAMES:%=%.js)
