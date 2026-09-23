import { type Course, type CourseCatalog, type CourseModality, type CourseStatus, isCourseModality, isCourseStatus } from '@axc/domain';

const COURSE_SORT_FIELDS = ['title', 'createdAt', 'updatedAt'] as const;
type CourseSortField = (typeof COURSE_SORT_FIELDS)[number];

export const INVALID_QUERY_PARAMETER_CODE = 'INVALID_QUERY_PARAMETER' as const;
export const INVALID_QUERY_PARAMETER_MESSAGE = 'One or more query parameters are invalid.' as const;

export interface CourseSearchQuery {
	q?: string | undefined;
	modality?: string | undefined;
	status?: string | undefined;
	tag?: string | undefined;
	page?: string | undefined;
	pageSize?: string | undefined;
	sort?: string | undefined;
}

export interface QueryParameterErrorDetail {
	field: string;
	message: string;
}

export interface InvalidQueryParameterError {
	code: typeof INVALID_QUERY_PARAMETER_CODE;
	message: typeof INVALID_QUERY_PARAMETER_MESSAGE;
	details: QueryParameterErrorDetail[];
}

export interface CourseSearchPage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export type CourseSearchResult = { ok: true; value: CourseSearchPage } | { ok: false; error: InvalidQueryParameterError };

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

function isCourseSortField(value: string): value is CourseSortField {
	return (COURSE_SORT_FIELDS as readonly string[]).includes(value);
}

export function searchCourses(catalog: CourseCatalog, query: CourseSearchQuery): CourseSearchResult {
	const parsed = parseCourseSearchQuery(query);
	if (!parsed.ok) {
		return parsed;
	}

	const { q, modality, status, tag, page, pageSize, sort } = parsed.value;
	let matches = [...catalog.list()];

	if (q !== undefined) {
		const needle = q.toLowerCase();
		matches = matches.filter((course) => courseMatchesKeyword(course, needle));
	}

	if (modality !== undefined) {
		matches = matches.filter((course) => course.modality === modality);
	}

	if (status !== undefined) {
		matches = matches.filter((course) => course.status === status);
	}

	if (tag !== undefined) {
		const expected = tag.toLowerCase();
		matches = matches.filter((course) => course.tags.some((courseTag) => courseTag.toLowerCase() === expected));
	}

	matches.sort((left, right) => compareCourses(left, right, sort));

	const totalItems = matches.length;
	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
	const start = (page - 1) * pageSize;
	const items = matches.slice(start, start + pageSize);

	return {
		ok: true,
		value: {
			items,
			page,
			pageSize,
			totalItems,
			totalPages,
		},
	};
}

interface ParsedCourseSearch {
	q: string | undefined;
	modality: CourseModality | undefined;
	status: CourseStatus | undefined;
	tag: string | undefined;
	page: number;
	pageSize: number;
	sort: CourseSortField;
}

function parseCourseSearchQuery(query: CourseSearchQuery): { ok: true; value: ParsedCourseSearch } | { ok: false; error: InvalidQueryParameterError } {
	const details: QueryParameterErrorDetail[] = [];

	const q = optionalText(query.q);
	const tag = optionalText(query.tag);
	const modality = parseEnumParameter(query.modality, 'modality', isCourseModality, 'modality must be one of: online, in-person, hybrid.', details);
	const status = parseEnumParameter(query.status, 'status', isCourseStatus, 'status must be one of: draft, active, retired.', details);
	const sort = parseEnumParameter(query.sort, 'sort', isCourseSortField, 'sort must be one of: title, createdAt, updatedAt.', details) ?? 'title';
	const page = parsePositiveInteger(query.page, 'page', DEFAULT_PAGE, undefined, 'page must be an integer greater than or equal to 1.', details);
	const pageSize = parsePositiveInteger(query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, 'pageSize must be between 1 and 50.', details);

	if (details.length > 0) {
		return {
			ok: false,
			error: {
				code: INVALID_QUERY_PARAMETER_CODE,
				message: INVALID_QUERY_PARAMETER_MESSAGE,
				details,
			},
		};
	}

	return {
		ok: true,
		value: {
			q,
			modality,
			status,
			tag,
			page,
			pageSize,
			sort,
		},
	};
}

function optionalText(value: string | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed === '' ? undefined : trimmed;
}

function parseEnumParameter<T extends string>(value: string | undefined, field: string, isAllowed: (candidate: string) => candidate is T, message: string, details: QueryParameterErrorDetail[]): T | undefined {
	if (value === undefined) {
		return undefined;
	}

	if (!isAllowed(value)) {
		details.push({ field, message });
		return undefined;
	}

	return value;
}

function parsePositiveInteger(value: string | undefined, field: string, defaultValue: number, maximum: number | undefined, message: string, details: QueryParameterErrorDetail[]): number {
	if (value === undefined) {
		return defaultValue;
	}

	if (!POSITIVE_INTEGER_PATTERN.test(value)) {
		details.push({ field, message });
		return defaultValue;
	}

	const parsed = Number.parseInt(value, 10);
	if (maximum !== undefined && parsed > maximum) {
		details.push({ field, message });
		return defaultValue;
	}

	return parsed;
}

function courseMatchesKeyword(course: Course, needle: string): boolean {
	if (course.title.toLowerCase().includes(needle) || course.summary.toLowerCase().includes(needle)) {
		return true;
	}

	return course.tags.some((courseTag) => courseTag.toLowerCase().includes(needle));
}

function compareCourses(left: Course, right: Course, sort: CourseSortField): number {
	if (sort === 'title') {
		return left.title.localeCompare(right.title);
	}

	return left[sort].localeCompare(right[sort]) || left.id.localeCompare(right.id);
}
