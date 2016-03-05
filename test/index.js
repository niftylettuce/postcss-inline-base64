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
const baseDir = join(__dirname, 'fixtures');

function run(t, input, output, opts = { }) {
	return postcss([plugin(opts)]).process(input)
		.then(result => {
			t.same(result.css, output);
			t.same(result.warnings().length, 0);
		});
}

test('local files', t => {
	return run(t, cssLocal, cssLocalOut, {
		baseDir
	});
});

test('external files', t => {
	return run(t, cssExternal, cssExternalOut);
});

test('no file', async t => {
	try {
		await postcss([plugin({baseDir: join(__dirname)})]).process('.test {background-image: url(base64(\'./fixtures\'));}');
		t.fail('Exception was not thrown');
	} catch (err) {
		t.is(err, 'It is not an url');
	}
});

test('url not found', async t => {
	try {
		await postcss([plugin({baseDir: join(__dirname)})]).process('.test {background-image: url(base64(\'http://cdn.lagden.in/nottt.png\'));}');
		t.fail('Exception was not thrown');
	} catch (err) {
		t.is(err.message, 'Response code 404 (Not Found)');
	}
});
