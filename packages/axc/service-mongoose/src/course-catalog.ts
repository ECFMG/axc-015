import type { Course, CourseCatalog, CourseModality, CourseStatus } from '@axc/domain';
import { createCourseSeed, createInMemoryCourseCatalog } from '@axc/persistence';
import mongoose, { type Model, Schema } from 'mongoose';

interface CourseMongoDocument {
	_id: string;
	title: string;
	summary: string;
	modality: CourseModality;
	status: CourseStatus;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

const courseSchema = new Schema<CourseMongoDocument>(
	{
		_id: { type: String, required: true },
		title: { type: String, required: true },
		summary: { type: String, required: true },
		modality: { type: String, required: true, enum: ['online', 'in-person', 'hybrid'] },
		status: { type: String, required: true, enum: ['draft', 'active', 'retired'] },
		tags: { type: [String], required: true },
		createdAt: { type: String, required: true },
		updatedAt: { type: String, required: true },
	},
	{ id: false, versionKey: false, timestamps: false },
);

export function createSeededCourseCatalog(courses: readonly Course[] = createCourseSeed()): CourseCatalog {
	const model = courseModel();
	const stored = courses.map((course) => {
		const document = new model({
			_id: course.id,
			title: course.title,
			summary: course.summary,
			modality: course.modality,
			status: course.status,
			tags: [...course.tags],
			createdAt: course.createdAt,
			updatedAt: course.updatedAt,
		});
		const error = document.validateSync();
		if (error) {
			throw new Error(`Invalid course seed ${course.id}: ${error.message}`);
		}
		const value = document.toObject();
		return {
			id: value._id,
			title: value.title,
			summary: value.summary,
			modality: value.modality,
			status: value.status,
			tags: [...value.tags],
			createdAt: value.createdAt,
			updatedAt: value.updatedAt,
		};
	});
	return createInMemoryCourseCatalog(stored);
}

function courseModel(): Model<CourseMongoDocument> {
	// biome-ignore lint/complexity/useLiteralKeys: Mongoose models is an index signature under noPropertyAccessFromIndexSignature
	const existing = mongoose.models['AxcCourse'] as Model<CourseMongoDocument> | undefined;
	if (existing) {
		return existing;
	}
	return mongoose.model<CourseMongoDocument>('AxcCourse', courseSchema);
}
