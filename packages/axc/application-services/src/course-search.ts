import {
	type CourseCatalog,
	type CourseSearchQuery,
	type CourseSearchResult,
	courseModalities,
	courseSortFields,
	courseStatuses,
	defaultCoursePage,
	defaultCoursePageSize,
	defaultCourseSort,
	maxCoursePageSize,
	searchCourses,
} from '@axc/domain';

export interface CourseQueryErrorDetail {
	readonly field: string;
	readonly message: string;
}

export type CourseQueryInput = Readonly<Record<string, readonly string[]>>;

const allowedQueryParameters = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'] as const;
type AllowedQueryParameter = (typeof allowedQueryParameters)[number];

export class InvalidCourseQueryError extends Error {
	readonly details: readonly CourseQueryErrorDetail[];

	constructor(details: readonly CourseQueryErrorDetail[]) {
		super('One or more query parameters are invalid.');
		this.name = 'InvalidCourseQueryError';
		this.details = details;
	}
}

export interface CourseSearchService {
	search(query: CourseQueryInput): Promise<CourseSearchResult>;
}

export function createCourseSearch(catalog: CourseCatalog): CourseSearchService {
	return {
		async search(query: CourseQueryInput): Promise<CourseSearchResult> {
			const parsed = parseCourseSearchQuery(query);
			const courses = await catalog.list();
			return searchCourses(courses, parsed);
		},
	};
}

function parseCourseSearchQuery(raw: CourseQueryInput): CourseSearchQuery {
	const details: CourseQueryErrorDetail[] = [];
	const unknownFields = Object.keys(raw)
		.filter((field) => !isAllowedQueryParameter(field))
		.sort();
	for (const field of unknownFields) {
		details.push({ field, message: `${field} is not a supported query parameter.` });
	}

	const q = readKeyword(raw, details);
	const modality = readChoice(raw, 'modality', courseModalities, 'modality must be one of online, in-person, hybrid.', details);
	const status = readChoice(raw, 'status', courseStatuses, 'status must be one of draft, active, retired.', details);
	const tag = readTag(raw, details);
	const page = readPage(raw, details);
	const pageSize = readPageSize(raw, details);
	const sort = readChoice(raw, 'sort', courseSortFields, 'sort must be one of title, createdAt, updatedAt.', details) ?? defaultCourseSort;

	if (details.length > 0) {
		throw new InvalidCourseQueryError(details);
	}

	return {
		page,
		pageSize,
		sort,
		...(q === undefined ? {} : { q }),
		...(modality === undefined ? {} : { modality }),
		...(status === undefined ? {} : { status }),
		...(tag === undefined ? {} : { tag }),
	};
}

function readKeyword(raw: CourseQueryInput, details: CourseQueryErrorDetail[]): string | undefined {
	const value = readSingle(raw, 'q', details);
	if (value === undefined || value.length === 0) {
		return undefined;
	}
	return value;
}

function readTag(raw: CourseQueryInput, details: CourseQueryErrorDetail[]): string | undefined {
	const value = readSingle(raw, 'tag', details);
	if (value === undefined) {
		return undefined;
	}
	if (value.length === 0) {
		details.push({ field: 'tag', message: 'tag must be a non-empty string.' });
		return undefined;
	}
	return value;
}

function readPage(raw: CourseQueryInput, details: CourseQueryErrorDetail[]): number {
	const value = readSingle(raw, 'page', details);
	if (value === undefined) {
		return defaultCoursePage;
	}
	if (!/^[1-9]\d*$/.test(value)) {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		return defaultCoursePage;
	}
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) {
		details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		return defaultCoursePage;
	}
	return parsed;
}

function readPageSize(raw: CourseQueryInput, details: CourseQueryErrorDetail[]): number {
	const value = readSingle(raw, 'pageSize', details);
	if (value === undefined) {
		return defaultCoursePageSize;
	}
	if (!/^[1-9]\d*$/.test(value)) {
		details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		return defaultCoursePageSize;
	}
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed > maxCoursePageSize) {
		details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		return defaultCoursePageSize;
	}
	return parsed;
}

function readChoice<T extends string>(raw: CourseQueryInput, field: AllowedQueryParameter, allowed: readonly T[], message: string, details: CourseQueryErrorDetail[]): T | undefined {
	const value = readSingle(raw, field, details);
	if (value === undefined) {
		return undefined;
	}
	if (!allowed.some((item) => item === value)) {
		details.push({ field, message });
		return undefined;
	}
	return value as T;
}

function readSingle(raw: CourseQueryInput, field: AllowedQueryParameter, details: CourseQueryErrorDetail[]): string | undefined {
	const values = raw[field];
	if (values === undefined) {
		return undefined;
	}
	const first = values[0];
	if (values.length !== 1 || first === undefined) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	return first.trim();
}

function isAllowedQueryParameter(field: string): field is AllowedQueryParameter {
	return (allowedQueryParameters as readonly string[]).includes(field);
}
