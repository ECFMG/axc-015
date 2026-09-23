Feature: Course catalog search

  Scenario: GET /api/courses returns the default page
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1 and the page size is 10
    And the course catalog total is at least 12
    And the course catalog returns at most 10 items

  Scenario: Keyword search matches title, summary, and tags
    When the client requests the course catalog with "q=SeCuRiTy&pageSize=50"
    Then the course catalog responds with status 200
    And the course catalog includes "AI Security Foundations"
    And the course catalog includes "Ethics Review Studio"
    And the course catalog includes "Workplace Conduct"

  Scenario: Modality filter returns only online courses
    When the client requests the course catalog with "modality=online&pageSize=50"
    Then the course catalog responds with status 200
    And every course modality is "online"

  Scenario: Combined filters return the matching course
    When the client requests the course catalog with "q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title"
    Then the course catalog responds with status 200
    And the course catalog returns 1 items
    And the course catalog includes "AI Security Foundations"

  Scenario: Catalog can be sorted by createdAt
    When the client requests the course catalog with "sort=createdAt&pageSize=50"
    Then the course catalog responds with status 200
    And the first course id is "course-014"

  Scenario: Invalid page size is rejected
    When the client requests the course catalog with "pageSize=51"
    Then the course catalog responds with status 400
    And the course catalog error code is "INVALID_QUERY_PARAMETER"
    And the course catalog error field "pageSize" says "pageSize must be between 1 and 50."

  Scenario: No matches return an empty page
    When the client requests the course catalog with "q=zzzz-nomatch"
    Then the course catalog responds with status 200
    And the course catalog total is 0
    And the course catalog returns 0 items
