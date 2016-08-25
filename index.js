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
const b64Regx = /b64\-{3}["']?(\s*[^)]+?\s*)["']?\-{3}/gm;
const cache = join('.', '.postcss-inline-base64');

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

function inline(file, dir) {
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
			debug('WriteFile cache ---> ', hash, file);
			return writeFile(join(cache, hash), result, {mode: 0o644}).then(() => result);
		})
		.catch(err => {
			debug('Catch inline ---> ', err.message);
			return false;
		});
}

function cache64(file, dir) {
	const hash = crypto.createHash('sha256').update(join(dir, file)).digest('hex');
	debug('Cache64 ---> ', hash);
	return mkdir(cache, 0o755)
		.then(() => find(hash, cache))
		.then(buf => {
			debug('Cache64 find buf ---> ', buf);
			return buf.toString('utf-8');
		})
		.catch(err => {
			debug('Cache64 catch ---> ', err.message);
			return inline(file, dir);
		});
}

module.exports = postcss.plugin('postcss-inline-base64', opts => {
	const options = Object.assign({baseDir: './', useCache: true}, opts);
	const promises = [];
	const decls = [];
	const regs = [];
	const fn = options.useCache ? cache64 : inline;
	debug('UseCache ---> ', options.useCache);
	return css => {
		css.walkDecls(decl => {
			const matches = decl.value.match(b64Regx) || [];
			const files = [];
			for (const match of matches) {
				files.push(match.replace(b64Regx, '$1'));
				regs.push(match);
			}
			for (const file of files) {
				promises.push(fn(file, options.baseDir));
				decls.push(decl);
			}
		});

		return Promise.all(promises)
			.then(inlines => {
				decls.forEach((decl, idx) => {
					const repl = inlines[idx] || regs[idx];
					decl.value = decl.value.replace(regs[idx], repl);
					if (inlines[idx] === false) {
						decl.value = `${decl.value} /* b64 error: invalid url or file */`;
					}
				});
			});
	};
});
