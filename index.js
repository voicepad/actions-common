const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const github = require('@actions/github');
const common = require(' actions-common-scans');
const _ = require('lodash');

const actionHelper = require('./action-helper');

async function run() {

    try {
        let workspace = process.env.GITHUB_WORKSPACE;
        let currentRunnerID = process.env.GITHUB_RUN_ID;
        let repoName = process.env.GITHUB_REPOSITORY;
        let token = core.getInput('token');
        let docker_name = core.getInput('docker_name');
        let target = core.getInput('target');
        let rulesFileLocation = core.getInput('rules_file_name');
        let cmdOptions = core.getInput('cmd_options');
        let issueTitle = core.getInput('issue_title');

        console.log('starting the program');
        console.log('github run id :' + currentRunnerID);

        let plugins = [];
        if (rulesFileLocation) {
            plugins = await actionHelper.processLineByLine(`${workspace}/${rulesFileLocation}`);
        }

        let command = (`docker run --user root -v ${workspace}:/zap/wrk/:rw --network="host" ` +
            `-t ${docker_name} zap-baseline.py -t ${target} -J ${jsonReportName} -w ${mdReportName}  -r ${htmlReportName} ${cmdOptions}`);

        if (plugins.length !== 0) {
            command = command + ` -c ${rulesFileLocation}`
        }

        try {
            await exec.exec(command);
        } catch (err) {
            core.setFailed('The ZAP Baseline scan has failed, starting to analyze the alerts. err: ' + err.toString());
        }
        await common.processReport(token, workspace, plugins, currentRunnerID, issueTitle, repoName);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
