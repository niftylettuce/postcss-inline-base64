/* eslint max-len: 0 */
/* eslint object-curly-spacing: 0 */
/* eslint indent: ["error", "tab"] */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const join = require('path').join;
const postcss = require('postcss');
const got = require('got');
const checkSvg = require('is-svg');
const fileType = require('file-type');
const pify = require('pify');
const mkdirp = require('mkdirp');
const debug = require('debug')('b64');

const access = pify(fs.access);
const readFile = pify(fs.readFile);
const writeFile = pify(fs.writeFile);
const mkdir = pify(mkdirp);

const urlRegx = /^(https?:|ftp:)?\/\/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
const b64Regx = /b64\-{3}"?'?(\s*[^)]+?\s*)"?'?\-{3}/g;
const cache = join('.', '.base64-cache');
const memCache = {};

debug('Dir cache ---> ', cache);

function find(file, dir) {
	const f = join(dir, file);
	debug('Find file ---> ', file);
	if (urlRegx.test(file)) {
		return got(file, {encoding: null, retries: 1, timeout: 5000}).then(r => r.body);
	}
	return access(f, fs.constants.R_OK).then(() => {
		debug('Find access ok ---> ', f);
		return readFile(f);
	});
}

function inline(file, dir, options) {
	return find(file, dir)
		.then(buf => {
			let mime = 'application/octet-stream';
			const isSvg = checkSvg(buf.toString('utf-8'));
			if (isSvg) {
				mime = 'image/svg+xml';
			} else {
				const chunk = new Buffer(262);
				buf.copy(chunk, 0, 0, 262);
				const o = fileType(chunk);
				if (o) {
					mime = o.mime;
				}
			}
			const result = `data:${mime};charset=utf-8;base64,${buf.toString('base64')}`;
			const hash = crypto.createHash('sha256').update(join(dir, file)).digest('hex');
			if (options.useMemCache) {
				memCache[hash] = result;
			}
			if (options.useCache) {
				debug('WriteFile cache ---> ', hash, file);
				return mkdir(cache, 0o755)
					.then(() => writeFile(join(cache, hash), result, {mode: 0o644}))
					.then(() => result);
			}
			return result;
		})
		.catch(err => {
			debug('Catch inline ---> ', err.message);
			return false;
		});
}

function cache64(file, dir, options) {
	const hash = crypto.createHash('sha256').update(join(dir, file)).digest('hex');
	debug('Cache64 ---> ', hash);
	if (memCache && memCache[hash]) {
		debug('Cache64 memCache ---> ', hash);
		return memCache[hash];
	}
	return mkdir(cache, 0o755)
		.then(() => find(hash, cache))
		.then(buf => {
			const result = buf.toString('utf-8');
			debug('Cache64 find buf ---> ', buf);
			return result;
		})
		.catch(err => {
			debug('Cache64 catch ---> ', err.message);
			return inline(file, dir, options);
		});
}

function capture(...args) {
	const [decl, promises, decls, regs, fn, options] = args;
	debug(decl.prop);
	debug('decl.value ---> ', decl.value);
	const matches = decl.value.match(b64Regx) || [];
	const files = [];
	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		files.push(match.replace(b64Regx, '$1'));
		regs.push(match);
	}
	debug('matches ---> ', matches);
	debug('files ---> ', files);
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		promises.push(fn(file, options.baseDir, options));
		decls.push(decl);
	}
}

module.exports = postcss.plugin('postcss-inline-base64', opts => {
	const options = Object.assign({baseDir: './', useCache: true, useMemCache: false}, opts);
	const promises = [];
	const decls = [];
	const regs = [];
	const fn = options.useCache || options.useMemCache ? cache64 : inline;
	debug('Use cache ---> ', options.useCache);
	return css => {
		css.walkAtRules(/^font\-face$/, rule => {
			rule.walkDecls(/^src$/, decl => {
				capture(decl, promises, decls, regs, fn, options);
			});
		});

		css.walkRules(rule => {
			rule.walkDecls(/^background(\-image)?$/, decl => {
				capture(decl, promises, decls, regs, fn, options);
			});
		});

		return Promise.all(promises)
			.then(inlines => {
				for (let idx = 0; idx < decls.length; idx++) {
					const decl = decls[idx];
					const repl = inlines[idx] || regs[idx];
					decl.value = decl.value.replace(regs[idx], repl);
					if (inlines[idx] === false) {
						decl.value = `${decl.value} /* b64 error: invalid url or file */`;
					}
				}
			});
	};
});
