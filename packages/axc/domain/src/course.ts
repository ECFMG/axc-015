export const courseModalities = ['online', 'in-person', 'hybrid'] as const;
export type CourseModality = (typeof courseModalities)[number];

export const courseStatuses = ['draft', 'active', 'retired'] as const;
export type CourseStatus = (typeof courseStatuses)[number];

export const courseSortFields = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseSortField = (typeof courseSortFields)[number];

export const defaultCoursePage = 1;
export const defaultCoursePageSize = 10;
export const maxCoursePageSize = 50;
export const defaultCourseSort = 'title' satisfies CourseSortField;

export interface Course {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: CourseModality;
	readonly status: CourseStatus;
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface CourseSearchQuery {
	readonly q?: string;
	readonly modality?: CourseModality;
	readonly status?: CourseStatus;
	readonly tag?: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sort: CourseSortField;
}

export interface CourseSearchResult {
	readonly items: readonly Course[];
	readonly page: number;
	readonly pageSize: number;
	readonly totalItems: number;
	readonly totalPages: number;
}

/** Read model for the course catalog. */
export interface CourseCatalog {
	list(): Promise<readonly Course[]>;
}

export function searchCourses(courses: readonly Course[], query: CourseSearchQuery): CourseSearchResult {
	const matched = courses.filter((course) => courseMatches(course, query));
	const sorted = [...matched].sort((left, right) => compareCourses(left, right, query.sort));
	const totalItems = sorted.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);
	const start = (query.page - 1) * query.pageSize;
	const items = Number.isSafeInteger(start) ? sorted.slice(start, start + query.pageSize).map(cloneCourse) : [];

	return {
		items,
		page: query.page,
		pageSize: query.pageSize,
		totalItems,
		totalPages,
	};
}

function courseMatches(course: Course, query: CourseSearchQuery): boolean {
	if (query.modality !== undefined && course.modality !== query.modality) {
		return false;
	}
	if (query.status !== undefined && course.status !== query.status) {
		return false;
	}
	if (query.tag !== undefined) {
		const expectedTag = query.tag.toLocaleLowerCase();
		if (!course.tags.some((tag) => tag.toLocaleLowerCase() === expectedTag)) {
			return false;
		}
	}
	if (query.q !== undefined) {
		const needle = query.q.toLocaleLowerCase();
		const fields = [course.title, course.summary, ...course.tags];
		if (!fields.some((field) => field.toLocaleLowerCase().includes(needle))) {
			return false;
		}
	}
	return true;
}

function compareCourses(left: Course, right: Course, sort: CourseSortField): number {
	const primary = sort === 'title' ? left.title.localeCompare(right.title, 'en', { sensitivity: 'base' }) : left[sort].localeCompare(right[sort]);
	if (primary !== 0) {
		return primary;
	}
	return left.id.localeCompare(right.id);
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
