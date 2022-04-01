BASEURL=https://output.circle-artifacts.com/output/job/${CIRCLE_WORKFLOW_JOB_ID}/artifacts/${CIRCLE_NODE_INDEX}
sed -i "8 s,.*,baseurl: $BASEURL,g" "_config.yml"
