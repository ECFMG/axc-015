import { buildApplicationServicesFactory } from '@axc/application-services';
import { describe, expect, it } from 'vitest';
import { createRestApp } from './index.ts';

interface CourseItem {
	id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

interface CoursePage {
	items: CourseItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface ErrorResponse {
	error: {
		code: string;
		message: string;
		details: Array<{ field: string; message: string }>;
	};
}

const app = createRestApp(buildApplicationServicesFactory({ environment: 'test' }));

describe('GET /api/courses', () => {
	it('returns the first page of courses sorted by title', async () => {
		const body = await getPage('');

		expect(body.page).toBe(1);
		expect(body.pageSize).toBe(10);
		expect(body.totalItems).toBe(14);
		expect(body.totalPages).toBe(2);
		expect(body.items).toHaveLength(10);
		expect(body.items.map((item) => item.id)).toEqual(['course-001', 'course-006', 'course-011', 'course-008', 'course-013', 'course-007', 'course-003', 'course-005', 'course-010', 'course-009']);
		expect(body.items[0]).toEqual({
			id: 'course-001',
			title: 'AI Security Foundations',
			summary: 'Introductory course on secure AI-assisted development.',
			modality: 'online',
			status: 'active',
			tags: ['ai', 'security'],
			createdAt: '2026-01-15T00:00:00.000Z',
			updatedAt: '2026-06-01T00:00:00.000Z',
		});
	});

	it('matches q across title, summary, and tags without regard to case', async () => {
		const body = await getPage('?q=SeCuRiTy&pageSize=50');
		const ids = body.items.map((item) => item.id);

		expect(ids).toEqual(['course-001', 'course-013', 'course-003', 'course-004', 'course-014', 'course-002', 'course-012']);
		expect(ids).not.toContain('course-006');
	});

	it('filters by modality, status, and tag', async () => {
		const online = await getPage('?modality=online&pageSize=50');
		expect(online.items.every((item) => item.modality === 'online')).toBe(true);
		expect(online.totalItems).toBe(6);

		const active = await getPage('?status=active&pageSize=50');
		expect(active.items.every((item) => item.status === 'active')).toBe(true);
		expect(active.totalItems).toBe(8);

		const tagged = await getPage('?tag=AI&pageSize=50');
		expect(tagged.items.map((item) => item.id)).toEqual(['course-001', 'course-005']);
	});

	it('combines keyword, modality, and status filters', async () => {
		const body = await getPage('?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title');

		expect(body).toEqual({
			items: [
				{
					id: 'course-001',
					title: 'AI Security Foundations',
					summary: 'Introductory course on secure AI-assisted development.',
					modality: 'online',
					status: 'active',
					tags: ['ai', 'security'],
					createdAt: '2026-01-15T00:00:00.000Z',
					updatedAt: '2026-06-01T00:00:00.000Z',
				},
			],
			page: 1,
			pageSize: 5,
			totalItems: 1,
			totalPages: 1,
		});
	});

	it('paginates with page and pageSize', async () => {
		const body = await getPage('?page=2&pageSize=5');

		expect(body.page).toBe(2);
		expect(body.pageSize).toBe(5);
		expect(body.totalItems).toBe(14);
		expect(body.totalPages).toBe(3);
		expect(body.items.map((item) => item.id)).toEqual(['course-007', 'course-003', 'course-005', 'course-010', 'course-009']);
	});

	it('returns an empty page past the end without failing', async () => {
		const body = await getPage('?page=4&pageSize=5');

		expect(body.items).toEqual([]);
		expect(body.page).toBe(4);
		expect(body.pageSize).toBe(5);
		expect(body.totalItems).toBe(14);
		expect(body.totalPages).toBe(3);
	});

	it('sorts by createdAt and updatedAt', async () => {
		const byCreatedAt = await getPage('?sort=createdAt&pageSize=50');
		expect(byCreatedAt.items.map((item) => item.id)).toEqual([
			'course-014',
			'course-009',
			'course-006',
			'course-010',
			'course-004',
			'course-001',
			'course-002',
			'course-003',
			'course-005',
			'course-007',
			'course-008',
			'course-011',
			'course-012',
			'course-013',
		]);

		const byUpdatedAt = await getPage('?sort=updatedAt&pageSize=50');
		expect(byUpdatedAt.items.map((item) => item.id)).toEqual([
			'course-009',
			'course-006',
			'course-004',
			'course-010',
			'course-003',
			'course-005',
			'course-002',
			'course-007',
			'course-001',
			'course-008',
			'course-011',
			'course-012',
			'course-013',
			'course-014',
		]);
	});

	it('accepts the maximum page size', async () => {
		const body = await getPage('?pageSize=50');
		expect(body.items).toHaveLength(14);
		expect(body.pageSize).toBe(50);
		expect(body.totalPages).toBe(1);
	});

	it('returns an empty list when nothing matches', async () => {
		const body = await getPage('?q=zzzz-nomatch');
		expect(body).toEqual({
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		});
	});

	it('rejects invalid modality, status, page, pageSize, and sort values', async () => {
		expect(await getError('?modality=classroom')).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [{ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' }],
			},
		});
		expect(await getError('?status=published')).toEqual({
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details: [{ field: 'status', message: 'status must be one of draft, active, retired.' }],
			},
		});
		expect((await getError('?page=0')).error.details).toEqual([{ field: 'page', message: 'page must be an integer greater than or equal to 1.' }]);
		expect((await getError('?page=abc')).error.details[0]?.field).toBe('page');
		expect((await getError('?pageSize=51')).error.details).toEqual([{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' }]);
		expect((await getError('?pageSize=0')).error.details[0]?.message).toBe('pageSize must be between 1 and 50.');
		expect((await getError('?sort=name')).error.details).toEqual([{ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' }]);
	});

	it('rejects unknown and repeated query parameters together', async () => {
		const body = await getError('?foo=1&modality=no&pageSize=99');
		expect(body.error.code).toBe('INVALID_QUERY_PARAMETER');
		expect(body.error.details).toEqual([
			{ field: 'foo', message: 'foo is not a supported query parameter.' },
			{ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' },
			{ field: 'pageSize', message: 'pageSize must be between 1 and 50.' },
		]);
	});

	it('rejects a duplicated query parameter', async () => {
		const body = await getError('?page=1&page=2');
		expect(body.error.details).toEqual([{ field: 'page', message: 'page must be provided once.' }]);
	});
});

describe('GET /health', () => {
	it('still reports the agentCourses health contract', async () => {
		const response = await app.request('http://localhost/health');
		expect(response.status).toBe(200);
		const body = (await response.json()) as { status: string; service: string; projectCode: string; environment: string };
		expect(body.status).toBe('ok');
		expect(body.service).toBe('agentCourses-api');
		expect(body.projectCode).toBe('axc');
		expect(body.environment).toBe('test');
	});
});

async function getPage(query: string): Promise<CoursePage> {
	const response = await app.request(`http://localhost/api/courses${query}`);
	expect(response.status).toBe(200);
	return (await response.json()) as CoursePage;
}

async function getError(query: string): Promise<ErrorResponse> {
	const response = await app.request(`http://localhost/api/courses${query}`);
	expect(response.status).toBe(400);
	return (await response.json()) as ErrorResponse;
}
