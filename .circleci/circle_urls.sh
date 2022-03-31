echo "CIRCLE_WORKFLOW_WORKSPACE_ID ${CIRCLE_WORKFLOW_WORKSPACE_ID}"
echo "CIRCLE_BUILD_NUM ${CIRCLE_BUILD_NUM}"
echo "CIRCLE_WORKFLOW_ID ${CIRCLE_WORKFLOW_ID}"
echo "CIRCLE_BUILD_NUM ${CIRCLE_BUILD_NUM}"
echo "CIRCLE_OIDC_TOKEN ${CIRCLE_OIDC_TOKEN}"
BASEURL=https://output.circle-artifacts.com/output/job/${CIRCLE_JOB}/artifacts/${CIRCLE_BUILD_NUM}/usrse.github.io/index.html
sed -i "8 s,.*,baseurl: $BASEURL,g" "_config.yml"
