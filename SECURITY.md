# Security
This is a place to document the aspects around securing the `dshop` codebase.

## Snyk
Snyk is a tool to analyze dependencies for known security risks. We have this tool built into the CICD as well.

### Local Dev

#### Install
`npm i -g snyk`

#### Scan
It is generally recommended to run a scan before pushing a pull request.
```
# Login
> npx snyk auth

# Run scan across whole project in root dir
> snyk test --severity-threshold=high  --all-projects

# Run scan in specific repo
> cd <package> && snyk test --severity-threshold=high
```

#### Fix
If you would like to attempt to update the identified vulnerability, you may run the following in the specific repo. Note that this command does not exist across all repos currently.
```
# Attempt to resolve in specific repo
> cd <package> && snyk wizard
```

Note that you can also create PR(s) via snyk.io very easily to fix dependencies.


### CICD(Github Actions)
We run a `Github Action` as a part of pushing a feature to automatically scan the dependencies and fail the build for a vulnerability of `high` or more.

If your build fails due to a security vulnerability, you should:
- Check the upgrade path to see if the vulnerability can be resolved by upgrading the dependency. Note that you can create PR(s) via snyk.io very easily to do this.
- If there is not an upgrade path or the collective team is not alarmed by the vulnerability, you can ignore the vulnerability for a an interval by running the following from the cli 
```
# default interval is 30 days - note that this gets appended to the .snyk file in the project root
snyk ignore --id=IssueID
```