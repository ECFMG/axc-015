Feature: Healthcheck

  Scenario: GET /health reports the API is healthy
    When the client requests the healthcheck
    Then the healthcheck responds with status 200
    And the healthcheck body matches the agentCourses contract
