import type { Course, CourseCatalog } from '@axc/domain';
import { createCourseSeed } from './course-seed.ts';

export function createInMemoryCourseCatalog(courses: readonly Course[] = createCourseSeed()): CourseCatalog {
	const stored = courses.map(cloneCourse);
	return {
		list(): Promise<readonly Course[]> {
			return Promise.resolve(stored.map(cloneCourse));
		},
	};
}

function cloneCourse(course: Course): Course {
	return {
		id: course.id,
		title: course.title,
		summary: course.summary,
		modality: course.modality,
		status: course.status,
		tags: [...course.tags],
		createdAt: course.createdAt,
		updatedAt: course.updatedAt,
	};
}
