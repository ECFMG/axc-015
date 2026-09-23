---
title: Course catalog decision
---

# Serve course search from a seeded in-memory catalog

## Status

Accepted

## Context

The course catalog needs `GET /api/courses` with keyword search, modality, status, and tag filters, plus pagination and sorting. The endpoint has to be testable without production data or an external database. The Azure Functions bundle for `@apps/api` should keep the existing healthcheck path working.

## Decision

The course shape and search rules live in `@axc/domain`. `@axc/persistence` holds a seed of 14 courses and an in-memory catalog. `@axc/application-services` parses query parameters and searches that catalog. `@axc/rest` maps `GET /api/courses` onto the use case and returns HTTP 400 for invalid queries. `@apps/api` injects the in-memory catalog and registers the Azure Functions route `api/courses`.

`@axc/service-mongoose` defines the same course shape as a Mongoose schema and checks the seed against it. The running API does not open a MongoDB connection for this read model.

## Consequences

- Search, filters, pagination, and validation can be tested through the Hono app without MongoDB.
- The Mongoose schema stays aligned with the seed, but catalog reads do not round-trip through a database.
- Sort order is ascending only. Keyword search is a case-insensitive substring match, not a tokenized text index.
- One `tag` parameter is accepted per request.
