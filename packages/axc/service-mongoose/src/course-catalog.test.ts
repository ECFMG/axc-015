import type { Course } from '@axc/domain';
import { createCourseSeed } from '@axc/persistence';
import { describe, expect, it } from 'vitest';
import { createSeededCourseCatalog } from './course-catalog.ts';

describe('mongoose course catalog', () => {
	it('accepts the course seed', async () => {
		const courses = await createSeededCourseCatalog().list();
		expect(courses).toEqual(createCourseSeed());
		expect(courses.length).toBeGreaterThanOrEqual(12);
	});

	it('rejects a course whose modality is outside the schema', () => {
		const [first] = createCourseSeed();
		expect(first).toBeDefined();
		if (!first) {
			return;
		}
		const invalid = { ...first, modality: 'remote' as Course['modality'] };
		expect(() => createSeededCourseCatalog([invalid])).toThrow(/Invalid course seed course-001/);
	});
});
