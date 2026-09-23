import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, isGreaterThan, isTrue } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface Course {
	id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

interface CourseSearchPage {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface CatalogErrorBody {
	error: {
		code: string;
		message: string;
		details: Array<{ field: string; message: string }>;
	};
}

const actor = () => actorCalled('API client');

const catalogPage = () =>
	Question.about('the catalog page', async (currentActor) => {
		return await currentActor.answer(LastResponse.body<CourseSearchPage>());
	});

When('the client requests GET {string}', (path: string) => actor().attemptsTo(Send.a(GetRequest.to(path))));

Then('the catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the catalog page uses page {int} and page size {int}', (page: number, pageSize: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('catalog page number', async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					return body.page;
				}),
			),
			equals(page),
		),
		Ensure.that(
			resolved(
				Question.about('catalog page size', async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					return body.pageSize;
				}),
			),
			equals(pageSize),
		),
	),
);

Then('the catalog contains at most {int} items', (maximum: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('catalog item count is within page size', async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					return body.items.length <= maximum;
				}),
			),
			isTrue(),
		),
	),
);

Then('the catalog items are sorted by {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`catalog items sorted by ${field}`, async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					const values = body.items.map((course) => {
						if (field === 'title') {
							return course.title;
						}
						if (field === 'createdAt') {
							return course.createdAt;
						}
						return course.updatedAt;
					});
					const sorted = [...values].sort((left, right) => left.localeCompare(right));
					return values.join('\0') === sorted.join('\0');
				}),
			),
			isTrue(),
		),
	),
);

Then('the catalog is not empty', () =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('catalog total items', async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					return body.totalItems;
				}),
			),
			isGreaterThan(0),
		),
	),
);

Then('every catalog item matches keyword {string}', (keyword: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`every item matches ${keyword}`, async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					const needle = keyword.toLowerCase();
					return body.items.every((course) => `${course.title} ${course.summary} ${course.tags.join(' ')}`.toLowerCase().includes(needle));
				}),
			),
			isTrue(),
		),
	),
);

Then('every catalog item has modality {string}', (modality: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`every item has modality ${modality}`, async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					return body.items.every((course) => course.modality === modality);
				}),
			),
			isTrue(),
		),
	),
);

Then('every catalog item has status {string}', (status: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`every item has status ${status}`, async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					return body.items.every((course) => course.status === status);
				}),
			),
			isTrue(),
		),
	),
);

Then('every catalog item has tag {string}', (tag: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`every item has tag ${tag}`, async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					const expected = tag.toLowerCase();
					return body.items.every((course) => course.tags.some((courseTag) => courseTag.toLowerCase() === expected));
				}),
			),
			isTrue(),
		),
	),
);

Then('catalog pagination metadata is consistent', () =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('pagination metadata', async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					const expectedPages = body.totalItems === 0 ? 0 : Math.ceil(body.totalItems / body.pageSize);
					return body.totalPages === expectedPages && body.items.length <= body.pageSize;
				}),
			),
			isTrue(),
		),
	),
);

Then('the catalog error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('catalog error code', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CatalogErrorBody>());
					return body.error.code;
				}),
			),
			equals(code),
		),
	),
);

Then('the catalog error details include field {string}', (field: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`catalog error field ${field}`, async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<CatalogErrorBody>());
					return body.error.details.some((detail) => detail.field === field);
				}),
			),
			isTrue(),
		),
	),
);

Then('the catalog items list is empty', () =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('catalog item length', async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					return body.items.length;
				}),
			),
			equals(0),
		),
	),
);

Then('catalog totalItems is {int}', (totalItems: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('catalog totalItems', async (currentActor) => {
					const body = await currentActor.answer(catalogPage());
					return body.totalItems;
				}),
			),
			equals(totalItems),
		),
	),
);
