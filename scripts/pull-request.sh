#!/bin/bash

# Suggested by Github actions to be strict
# Taken from https://www.github.com/vsoch/pull-request-action
set -e
set -o pipefail

################################################################################
# Global Variables (we can't use GITHUB_ prefix)
################################################################################

API_VERSION=v3
BASE=https://api.github.com
AUTH_HEADER="Authorization: token ${GITHUB_TOKEN}"
HEADER="Accept: application/vnd.github.${API_VERSION}+json"
HEADER="${HEADER}; application/vnd.github.antiope-preview+json; application/vnd.github.shadow-cat-preview+json"

# URLs
REPO_URL="${BASE}/repos/${GITHUB_REPOSITORY}"
PULLS_URL=$REPO_URL/pulls

################################################################################
# Helper Functions
################################################################################


check_credentials() {

    if [[ -z "${GITHUB_TOKEN}" ]]; then
        echo "You must include the GITHUB_TOKEN as an environment variable."
        exit 1
    fi

}

check_events_json() {

    if [[ ! -f "${GITHUB_EVENT_PATH}" ]]; then
        echo "Cannot find Github events file at ${GITHUB_EVENT_PATH}";
        exit 1;
    fi
    echo "Found ${GITHUB_EVENT_PATH}";
    
}

create_pull_request() {

    SOURCE="${1}"  # from this branch
    TARGET="${2}"  # pull request TO this target
    BODY="${3}"    # this is the content of the message
    TITLE="${4}"   # pull request title
    DRAFT="${5}"   # if PRs are draft

    # Check if the branch already has a pull request open 

    DATA="{\"base\":\"${TARGET}\", \"head\":\"${SOURCE}\", \"body\":\"${BODY}\"}"
    RESPONSE=$(curl -sSL -H "${AUTH_HEADER}" -H "${HEADER}" --user "${GITHUB_ACTOR}" -X GET --data "${DATA}" ${PULLS_URL})
    PR=$(echo "${RESPONSE}" | jq --raw-output '.[] | .head.ref')
    echo "Response ref: ${PR}"

    # Option 1: The pull request is already open
    if [[ "${PR}" == "${SOURCE}" ]]; then
        echo "Pull request from ${SOURCE} to ${TARGET} is already open!"

    # Option 2: Open a new pull request
    else
        # Post the pull request
        DATA="{\"title\":\"${TITLE}\", \"base\":\"${TARGET}\", \"head\":\"${SOURCE}\", \"draft\":\"${DRAFT}\"}"
        echo "curl --user ${GITHUB_ACTOR} -X POST --data ${DATA} ${PULLS_URL}"
        curl -sSL -H "${AUTH_HEADER}" -H "${HEADER}" --user "${GITHUB_ACTOR}" -X POST --data "${DATA}" ${PULLS_URL}
        echo $?
    fi
}


main () {

    # path to file that contains the POST response of the event
    # Example: https://github.com/actions/bin/tree/master/debug
    # Value: /github/workflow/event.json
    check_events_json;

    # User specified branch for PR
    if [ -z "${BRANCH_FROM}" ]; then
        echo "You must specify a branch to PR from."
        exit 1
    fi
    echo "Branch for pull request is $BRANCH_FROM"

    if [ -z "${BRANCH_AGAINST}" ]; then
        BRANCH_AGAINST=master
    fi
    echo "Pull request will go against ${BRANCH_AGAINST}"

    if [ -z "${PULL_REQUEST_DRAFT}" ]; then
        echo "No explicit preference for draft PR: created PRs will be normal PRs."
        PULL_REQUEST_DRAFT="false"
    else
        echo "Environment variable PULL_REQUEST_DRAFT set to a value: created PRs will be draft PRs."
        PULL_REQUEST_DRAFT="true"
    fi

    # Ensure we have a GitHub token
    check_credentials

    # Pull request body (optional)
    if [ -z "${PULL_REQUEST_BODY}" ]; then
        echo "No pull request body is set, will use default."
        PULL_REQUEST_BODY="This is an automated pull request from ${BRANCH_FROM} to ${BRANCH_AGAINST}"
        echo "Pull request body is ${PULL_REQUEST_BODY}"
    fi
 
    # Pull request title (optional)
    if [ -z "${PULL_REQUEST_TITLE}" ]; then
        echo "No pull request title is set, will use default."
        PULL_REQUEST_TITLE="Update ${BRANCH_AGAINST} from ${BRANCH_FROM}"
        echo "Pull request title is ${PULL_REQUEST_TITLE}"
    fi

    create_pull_request $BRANCH_FROM $BRANCH_AGAINST $PULL_REQUEST_BODY $PULL_REQUEST_TITLE $PULL_REQUEST_DRAFT

}

echo "==========================================================================
START: Creating Membership Count Update Pull Request!";
main;
echo "==========================================================================
END: Finished";
