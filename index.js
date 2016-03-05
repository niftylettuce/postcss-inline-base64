'use strict';

const fs = require('fs');
const join = require('path').join;
const postcss = require('postcss');
const got = require('got');
const checkSvg = require('is-svg');
const fileType = require('file-type');
const promisify = require('lagden-promisify');
const status = promisify(fs.stat);
const readfile = promisify(fs.readFile);

function find(file, dir) {
	const f = join(dir, file);
	return status(f)
		.then(s => {
			if (s.isFile()) {
				return readfile(f);
			}
			return Promise.reject('It is not a file');
		})
		.catch(() => got(file, {encoding: null}).then(r => r.body));
}

function inLine(file, dir) {
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
			return `data:${mime};charset=utf-8;base64,${buf.toString('base64')}`;
		});
}

module.exports = postcss.plugin('postcss-inline-base64', opts => {
	const options = Object.assign({baseDir: './'}, opts);
	const promises = [];
	const decls = [];
	const regs = [];
	return css => {
		css.walkDecls(decl => {
			const matches = decl.value.match(/base64\(\'(\s*[^)]+?\s*)\'\)/);
			if (matches && Array.isArray(matches) && matches.length > 1) {
				promises.push(inLine(matches[1], options.baseDir));
				decls.push(decl);
				regs.push(matches);
			}
		});

		return Promise.all(promises)
			.then(inlines => {
				decls.forEach((decl, idx) => {
					decl.value = regs[idx].input.replace(regs[idx][0], inlines[idx]);
				});
			});
	};
});
