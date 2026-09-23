import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;

interface CourseItem {
	id: string;
	title: string;
	modality: string;
}

interface CourseListResponse {
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

const actor = () => actorCalled('API client');

const catalog = () =>
	Question.about('the course catalog body', async (currentActor) => {
		return await currentActor.answer(LastResponse.body<CourseListResponse>());
	});

When('the client requests the course catalog', () => actor().attemptsTo(Send.a(GetRequest.to('/api/courses'))));

When('the client requests the course catalog with {string}', (query: string) => actor().attemptsTo(Send.a(GetRequest.to(`/api/courses?${query}`))));

Then('the course catalog responds with status {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));

Then('the course catalog page is {int} and the page size is {int}', (page: number, pageSize: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the page and page size', async (currentActor) => {
					const body = await currentActor.answer(catalog());
					return body.page === page && body.pageSize === pageSize;
				}),
			),
			equals(true),
		),
	),
);

Then('the course catalog total is at least {int}', (minimum: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the catalog total', async (currentActor) => {
					const body = await currentActor.answer(catalog());
					return body.totalItems >= minimum;
				}),
			),
			equals(true),
		),
	),
);

Then('the course catalog total is {int}', (total: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the catalog total', async (currentActor) => {
					const body = await currentActor.answer(catalog());
					return body.totalItems;
				}),
			),
			equals(total),
		),
	),
);

Then('the course catalog returns at most {int} items', (maximum: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the item count', async (currentActor) => {
					const body = await currentActor.answer(catalog());
					return body.items.length <= maximum && body.items.length > 0;
				}),
			),
			equals(true),
		),
	),
);

Then('the course catalog returns {int} items', (count: number) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the item count', async (currentActor) => {
					const body = await currentActor.answer(catalog());
					return body.items.length;
				}),
			),
			equals(count),
		),
	),
);

Then('the course catalog includes {string}', (title: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about(`whether ${title} is listed`, async (currentActor) => {
					const body = await currentActor.answer(catalog());
					return body.items.some((item) => item.title === title);
				}),
			),
			equals(true),
		),
	),
);

Then('every course modality is {string}', (modality: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('course modalities', async (currentActor) => {
					const body = await currentActor.answer(catalog());
					return body.items.length > 0 && body.items.every((item) => item.modality === modality);
				}),
			),
			equals(true),
		),
	),
);

Then('the first course id is {string}', (id: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the first course id', async (currentActor) => {
					const body = await currentActor.answer(catalog());
					return body.items[0]?.id ?? '';
				}),
			),
			equals(id),
		),
	),
);

Then('the course catalog error code is {string}', (code: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the error code', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<ErrorResponse>());
					return body.error.code;
				}),
			),
			equals(code),
		),
	),
);

Then('the course catalog error field {string} says {string}', (field: string, message: string) =>
	actor().attemptsTo(
		Ensure.that(
			resolved(
				Question.about('the error detail', async (currentActor) => {
					const body = await currentActor.answer(LastResponse.body<ErrorResponse>());
					return body.error.details.some((detail) => detail.field === field && detail.message === message);
				}),
			),
			equals(true),
		),
	),
);
