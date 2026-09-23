Feature: Course catalog search

  Scenario: GET /api/courses returns a paginated catalog
    When the client requests GET "/api/courses"
    Then the catalog responds with status 200
    And the catalog page uses page 1 and page size 10
    And the catalog contains at most 10 items
    And the catalog items are sorted by "title"

  Scenario: Keyword search is case-insensitive across title, summary, and tags
    When the client requests GET "/api/courses?q=SECURITY&pageSize=50"
    Then the catalog responds with status 200
    And the catalog is not empty
    And every catalog item matches keyword "security"

  Scenario: Filter by modality
    When the client requests GET "/api/courses?modality=online&pageSize=50"
    Then the catalog responds with status 200
    And every catalog item has modality "online"

  Scenario: Filter by status
    When the client requests GET "/api/courses?status=active&pageSize=50"
    Then the catalog responds with status 200
    And every catalog item has status "active"

  Scenario: Filter by tag
    When the client requests GET "/api/courses?tag=AI&pageSize=50"
    Then the catalog responds with status 200
    And every catalog item has tag "ai"

  Scenario: Combined keyword, modality, and status filters
    When the client requests GET "/api/courses?q=security&modality=online&status=active&pageSize=50"
    Then the catalog responds with status 200
    And every catalog item matches keyword "security"
    And every catalog item has modality "online"
    And every catalog item has status "active"

  Scenario: Pagination metadata
    When the client requests GET "/api/courses?page=1&pageSize=5"
    Then the catalog responds with status 200
    And the catalog page uses page 1 and page size 5
    And the catalog contains at most 5 items
    And catalog pagination metadata is consistent

  Scenario: Sort by createdAt
    When the client requests GET "/api/courses?sort=createdAt&pageSize=50"
    Then the catalog responds with status 200
    And the catalog items are sorted by "createdAt"

  Scenario: Invalid modality returns 400
    When the client requests GET "/api/courses?modality=remote"
    Then the catalog responds with status 400
    And the catalog error code is "INVALID_QUERY_PARAMETER"
    And the catalog error details include field "modality"

  Scenario: Invalid page returns 400
    When the client requests GET "/api/courses?page=0"
    Then the catalog responds with status 400
    And the catalog error details include field "page"

  Scenario: Invalid pageSize returns 400
    When the client requests GET "/api/courses?pageSize=51"
    Then the catalog responds with status 400
    And the catalog error details include field "pageSize"

  Scenario: Invalid sort returns 400
    When the client requests GET "/api/courses?sort=popularity"
    Then the catalog responds with status 400
    And the catalog error details include field "sort"

  Scenario: No matches return an empty catalog page
    When the client requests GET "/api/courses?q=no-such-course-zzzz"
    Then the catalog responds with status 200
    And the catalog items list is empty
    And catalog totalItems is 0
