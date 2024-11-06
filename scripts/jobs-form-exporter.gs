// This crude script sends an email with information about a jobs board
// form submission, including a prepared YAML representation suitable
// for pasting into a GitHub PR.
//
// It should be installed into the Google Sheet backing the US-RSE jobs
// board submission form through "Extensions->Apps Script->Code.gs",
// and configured to run "onSubmit".
//
// NOTE: this script assumes that the data from the cells is non-null
// because the Google Form marks all of the fields as required
// Also, be sure to update the "mailto" value below with the actual
// intended list of receipients when putting it into Google.
//
// sample entry:
// - expires: 2022-11-30
//   location: Globus - University of Chicago, Chicago, IL or remote/flexible
//   name: Software Engineer
//   posted: 2022-09-12
//   url: https://uchicago.wd5.myworkdayjobs.com/External/job/Chicago-IL/Software-Engineer_JR17859
//
//
function onFormSubmit(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rowID = ss.getLastRow();

  // mail message parameters
  const mailto = 'someone@wherever.edu'; // add new recipients here, separated by comma
  const mailsubject = 'US-RSE Jobs Form notification';
  var mailbody = 'Raw data for US-RSE job form submission: ' + rowID + '\n';
  var data = [];

  var headers = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues()[0];
  for (var header in headers) {
    mailbody += headers[header] + ': ' + e.namedValues[headers[header]].toString() + '\n';
    data.push(e.namedValues[headers[header]]);
  }

  // naive mapping of cells to elements.  sorry, this is gross
  const location = data[4] + ', ' + data[5];
  const name = data[3];
  const url = data[6];
  // convert MM/DD/YYYY to YYYY-MM-DD. surely there's got to be a simpler way to do these...
  var exptmp = new Date(data[7]);
  var expires = exptmp.toISOString().split('T')[0];
  var posttmp = new Date();
  var posted = posttmp.toISOString().split('T')[0];

  mailbody += '\n\n\nPrepared YAML for US-RSE job form submission: ' + rowID + '\n';
  mailbody += 'Prepend this to the appropriate jobs file, _data/jobs.yml or _data/related-jobs.yml.\n'
  mailbody += 'NOTE: this is a rough conversion.  Be sure to sanity check before using it verbatim.\n\n';
  mailbody += '\
- expires: ' + expires + '\n\
  location: ' + location + '\n\
  name: ' + name + '\n\
  posted: ' + posted + '\n\
  url: ' + url + '\n'

  // Send the email
  GmailApp.sendEmail(mailto, mailsubject, mailbody);
}
