import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;

export type { Course, CourseCatalog, CourseModality, CourseSearchQuery, CourseSearchResult, CourseSortField, CourseStatus } from './course.ts';
export { courseModalities, courseSortFields, courseStatuses, defaultCoursePage, defaultCoursePageSize, defaultCourseSort, maxCoursePageSize, searchCourses } from './course.ts';
