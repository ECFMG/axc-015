import { COURSE_MODALITIES, COURSE_STATUSES } from '@axc/domain';
import { describe, expect, it } from 'vitest';
import { type CourseSearchQuery, INVALID_QUERY_PARAMETER_CODE, INVALID_QUERY_PARAMETER_MESSAGE } from './course-search.ts';
import { buildApplicationServicesFactory } from './index.ts';

async function search(query: CourseSearchQuery = {}) {
	const services = await buildApplicationServicesFactory({ environment: 'test' }).forRequest();
	return services.courses.search(query);
}

function expectOk(result: Awaited<ReturnType<typeof search>>) {
	expect(result.ok).toBe(true);
	if (!result.ok) {
		throw new Error('expected a successful course search');
	}
	return result.value;
}

function expectInvalid(result: Awaited<ReturnType<typeof search>>, field: string) {
	expect(result.ok).toBe(false);
	if (result.ok) {
		throw new Error('expected INVALID_QUERY_PARAMETER');
	}
	expect(result.error.code).toBe(INVALID_QUERY_PARAMETER_CODE);
	expect(result.error.message).toBe(INVALID_QUERY_PARAMETER_MESSAGE);
	expect(result.error.details.some((detail) => detail.field === field)).toBe(true);
}

describe('course catalog search', () => {
	it('returns a paginated catalog with default page and page size', async () => {
		const page = expectOk(await search());

		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.items).toHaveLength(10);
		expect(page.totalItems).toBeGreaterThanOrEqual(12);
		expect(page.totalPages).toBe(Math.ceil(page.totalItems / page.pageSize));
		expect(page.items.map((course) => course.title)).toStrictEqual([...page.items.map((course) => course.title)].sort((left, right) => left.localeCompare(right)));
	});

	it('seeds mixed modalities, statuses, and tags', async () => {
		const page = expectOk(await search({ pageSize: '50' }));
		const modalities = new Set(page.items.map((course) => course.modality));
		const statuses = new Set(page.items.map((course) => course.status));
		const tags = new Set(page.items.flatMap((course) => course.tags));

		for (const modality of COURSE_MODALITIES) {
			expect(modalities.has(modality)).toBe(true);
		}
		for (const status of COURSE_STATUSES) {
			expect(statuses.has(status)).toBe(true);
		}
		expect(tags.size).toBeGreaterThan(1);
		for (const course of page.items) {
			expect(course.id.length).toBeGreaterThan(0);
			expect(course.title.length).toBeGreaterThan(0);
			expect(course.summary.length).toBeGreaterThan(0);
			expect(course.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			expect(course.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		}
	});

	it('matches q case-insensitively across title, summary, and tags', async () => {
		const page = expectOk(await search({ q: 'SECURITY', pageSize: '50' }));
		const all = expectOk(await search({ pageSize: '50' }));

		expect(page.totalItems).toBeGreaterThan(0);
		expect(page.totalItems).toBeLessThan(all.totalItems);
		expect(page.items.some((course) => course.title.toLowerCase().includes('security'))).toBe(true);
		expect(page.items.some((course) => course.summary.toLowerCase().includes('security') && !course.title.toLowerCase().includes('security'))).toBe(true);
		expect(page.items.some((course) => course.tags.some((tag) => tag.toLowerCase().includes('security')) && !course.title.toLowerCase().includes('security') && !course.summary.toLowerCase().includes('security'))).toBe(true);
		for (const course of page.items) {
			const haystack = `${course.title} ${course.summary} ${course.tags.join(' ')}`.toLowerCase();
			expect(haystack.includes('security')).toBe(true);
		}
	});

	it('filters by modality, status, and tag', async () => {
		const online = expectOk(await search({ modality: 'online', pageSize: '50' }));
		const active = expectOk(await search({ status: 'active', pageSize: '50' }));
		const ai = expectOk(await search({ tag: 'AI', pageSize: '50' }));

		expect(online.totalItems).toBeGreaterThan(0);
		expect(active.totalItems).toBeGreaterThan(0);
		expect(ai.totalItems).toBeGreaterThan(0);
		expect(online.items.every((course) => course.modality === 'online')).toBe(true);
		expect(active.items.every((course) => course.status === 'active')).toBe(true);
		expect(ai.items.every((course) => course.tags.some((tag) => tag.toLowerCase() === 'ai'))).toBe(true);
	});

	it('applies combined q, modality, and status filters', async () => {
		const page = expectOk(
			await search({
				q: 'security',
				modality: 'online',
				status: 'active',
				pageSize: '50',
			}),
		);

		expect(page.totalItems).toBeGreaterThan(0);
		for (const course of page.items) {
			const haystack = `${course.title} ${course.summary} ${course.tags.join(' ')}`.toLowerCase();
			expect(haystack.includes('security')).toBe(true);
			expect(course.modality).toBe('online');
			expect(course.status).toBe('active');
		}
	});

	it('paginates with page and pageSize', async () => {
		const first = expectOk(await search({ page: '1', pageSize: '5', sort: 'title' }));
		const second = expectOk(await search({ page: '2', pageSize: '5', sort: 'title' }));
		const all = expectOk(await search({ pageSize: '50', sort: 'title' }));

		expect(first.items).toHaveLength(5);
		expect(first.page).toBe(1);
		expect(first.pageSize).toBe(5);
		expect(first.totalItems).toBe(all.totalItems);
		expect(first.totalPages).toBe(Math.ceil(all.totalItems / 5));
		expect(first.items.map((course) => course.id)).toStrictEqual(all.items.slice(0, 5).map((course) => course.id));
		expect(second.items.map((course) => course.id)).toStrictEqual(all.items.slice(5, 10).map((course) => course.id));
	});

	it('sorts by createdAt', async () => {
		const page = expectOk(await search({ sort: 'createdAt', pageSize: '50' }));
		const timestamps = page.items.map((course) => course.createdAt);
		expect(timestamps).toStrictEqual([...timestamps].sort((left, right) => left.localeCompare(right)));
	});

	it('sorts by updatedAt', async () => {
		const page = expectOk(await search({ sort: 'updatedAt', pageSize: '50' }));
		const timestamps = page.items.map((course) => course.updatedAt);
		expect(timestamps).toStrictEqual([...timestamps].sort((left, right) => left.localeCompare(right)));
	});

	it('rejects invalid enum, page, pageSize, and sort values', async () => {
		expectInvalid(await search({ modality: 'remote' }), 'modality');
		expectInvalid(await search({ status: 'published' }), 'status');
		expectInvalid(await search({ page: '0' }), 'page');
		expectInvalid(await search({ page: '1.5' }), 'page');
		expectInvalid(await search({ pageSize: '51' }), 'pageSize');
		expectInvalid(await search({ pageSize: '0' }), 'pageSize');
		expectInvalid(await search({ sort: 'popularity' }), 'sort');

		const combined = await search({ modality: 'remote', page: '-1', pageSize: '100', sort: 'score' });
		expect(combined.ok).toBe(false);
		if (combined.ok) {
			throw new Error('expected combined validation failures');
		}
		expect(combined.error.details.map((detail) => detail.field)).toEqual(expect.arrayContaining(['modality', 'page', 'pageSize', 'sort']));
	});

	it('returns an empty list with pagination metadata when nothing matches', async () => {
		const page = expectOk(await search({ q: 'no-such-course-zzzz' }));

		expect(page.items).toStrictEqual([]);
		expect(page.page).toBe(1);
		expect(page.pageSize).toBe(10);
		expect(page.totalItems).toBe(0);
		expect(page.totalPages).toBe(0);
	});
});
