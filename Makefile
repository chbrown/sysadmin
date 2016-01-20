BIN := node_modules/.bin
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)
TYPESCRIPT_BASENAMES = $(basename $(TYPESCRIPT))
NODE_ARGS := --use_strict --harmony_default_parameters --harmony_destructuring --harmony_rest_parameters

all: $(TYPESCRIPT_BASENAMES:%=%.js) build/site.css build/bundle.js .gitignore .npmignore

$(BIN)/tsc $(BIN)/webpack:
	npm install

.gitignore: tsconfig.json
	echo $(TYPESCRIPT_BASENAMES:%=/%.js) /build | tr ' ' '\n' > $@

.npmignore: tsconfig.json
	echo $(TYPESCRIPT) Makefile tsconfig.json webpack.config.js | tr ' ' '\n' > $@

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc

%.js: %.tsx $(BIN)/tsc
	$(BIN)/tsc

server: server.js
	node $(NODE_ARGS) server.js

dev: $(BIN)/webpack
	(\
   $(BIN)/webpack --watch --config webpack.config.js & \
   $(BIN)/tsc --watch & \
   node_restarter '**/*.js' '!**/bundle.js' '!node_modules/**/*.js' 'node $(NODE_ARGS) server.js' & \
   wait)

build/bundle.js build/site.css: webpack.config.js app.tsx site.less
	NODE_ENV=production $(BIN)/webpack --config $<

clean:
	rm -f $(TYPESCRIPT_BASENAMES:%=%.d.ts) $(TYPESCRIPT_BASENAMES:%=%.js)
