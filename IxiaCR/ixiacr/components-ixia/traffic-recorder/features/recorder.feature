Feature: A single traffic recorder

  Scenario: Initial state

    Given I have no recorder
    When I add a recorder
    Then the default device is selected


    And the name is "New recorder"
    And no ports are selected
    And the option to truncate packets is not selected
    And none of the stop criteria are selected
    And the capture filter is blank

  @Pending
  Scenario: Changing the name

    Given I have a new recorder
    When I click the name
    Then I should be able to edit the name

  @Pending
  Scenario: Selecting a port

    Given I have a new recorder
    When I click physical port 1
    Then physical port 1 should appear selected
    And physical port 1 should appear in the configuration

  @Pending
  Scenario: Attempting to select a second port (not allowed)

    Given I have a recorder with physical port 1 selected
    When I click physical port 2
    Then only physical port 2 should appear selected
    And only physical port 2 should appear in the configuration

  @Pending
  Scenario: Enabling packet truncation

    Given I have a new recorder
    When I turn packet truncation on
    Then a default value for packet size should appear in bytes
    And an option to change packet size should exist
    And packet truncation at the default value should appear in the configuration
