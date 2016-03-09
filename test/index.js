'use strict';

import {readFileSync} from 'fs';
import {join} from 'path';
import postcss from 'postcss';
import test from 'ava';
import plugin from '../';

const cssLocal = readFileSync(join(__dirname, 'fixtures', 'local.css')).toString('utf-8');
const cssLocalOut = readFileSync(join(__dirname, 'fixtures', 'local.out.css')).toString('utf-8');
const cssExternal = readFileSync(join(__dirname, 'fixtures', 'external.css')).toString('utf-8');
const cssExternalOut = readFileSync(join(__dirname, 'fixtures', 'external.out.css')).toString('utf-8');
const cssSyntax = readFileSync(join(__dirname, 'fixtures', 'syntax.css')).toString('utf-8');
const cssSyntaxOut = readFileSync(join(__dirname, 'fixtures', 'syntax.out.css')).toString('utf-8');
const baseDir = join(__dirname, 'fixtures');

function run(t, input, output, opts = { }) {
	return postcss([plugin(opts)]).process(input)
		.then(result => {
			t.same(result.css, output);
			t.same(result.warnings().length, 0);
		});
}

test('local', t => {
	return run(t, cssLocal, cssLocalOut, {baseDir});
});

test('external', t => {
	return run(t, cssExternal, cssExternalOut);
});

test('syntax', t => {
	return run(t, cssSyntax, cssSyntaxOut, {baseDir});
});

test('file error', t => {
	const css = '.test {background-image: url(b64---./fixtures---);}';
	const cssOut = '.test {background-image: url(./fixtures)/* b64 error: invalid url or file */;}';
	return run(t, css, cssOut, {baseDir: join(__dirname)});
});

test('url error', t => {
	const css = '.test {background-image: url(b64---"http://cdn.lagden.in/nottt.png"---);}';
	const cssOut = '.test {background-image: url(http://cdn.lagden.in/nottt.png)/* b64 error: invalid url or file */;}';
	return run(t, css, cssOut, {baseDir: join(__dirname)});
});
