BIN := node_modules/.bin
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)
NODE_ARGS := --use_strict --harmony_default_parameters --harmony_destructuring

all: server.js .gitignore

$(BIN)/tsc $(BIN)/webpack:
	npm install

.gitignore: tsconfig.json
	echo $(patsubst %.tsx,/%.js,$(patsubst %.ts,/%.js,$(TYPESCRIPT))) /static/build | tr ' ' '\n' > $@

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc

%.js: %.tsx $(BIN)/tsc
	$(BIN)/tsc

server: server.js
	node_restarter '**/*.js' '!**/bundle.js' '!node_modules/**/*.js' 'node $(NODE_ARGS) server.js'

dev: $(BIN)/webpack
	$(BIN)/webpack --watch --config webpack.config.js
