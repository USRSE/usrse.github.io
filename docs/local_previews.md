# Working with the repo locally

Content-only changes can often be done directly on the GitHub website.  Changes affecting the function or structure of the site should be previewed fully locally before being submitted via PR.

## Jekyll

To preview the site locally, clone it.

Then you'll need to [install jekyll](https://jekyllrb.com/docs/installation/).

Then go to the root of the site and issue (just once):

```bash
$ bundle install
```

which will install the necessary Ruby gems (the info for this is included in the repo files).

And then (also in the top level directory of your forked repository) to be able to see the rendered website, run

```bash
$ jekyll serve
# or
$ bundle exec jekyll serve
```

and open your browser to <http://localhost:4000>.
If you are having trouble try `rm -rf _site Gemfile.lock`, followed by `bundle update`, then `bundle exec jekyll serve`.


## Container-based development

You can build and run a Docker container to preview the site locally and support a local development workflow. If you do not already have Docker installed, please visit https://docs.docker.com/get-docker/ and follow the links to get started with Docker on your operating system.

These instructions also work with the [Podman](https://podman.io/) container management tool simply by substituting `podman` for `docker` in the commands below.  This can either be done manually, by creating a shell alias (e.g., `alias podman=docker`), or by installing a package such as `podman-docker` to automatically handle this translation.

Build the container image:

```bash
docker build -t us-rse-website:latest .
```

Run the container to access the website at the URL http://127.0.0.1:4000/

```bash
$ docker run --rm -it -p 4000:4000 us-rse-website:latest
Configuration file: /srv/jekyll/_config.yml
            Source: /srv/jekyll
       Destination: /srv/jekyll/_site
 Incremental build: disabled. Enable with --incremental
      Generating... 
       Jekyll Feed: Generating feed for posts
                    done in 6.215 seconds.
 Auto-regeneration: enabled for '/srv/jekyll'
LiveReload address: http://0.0.0.0:35729
    Server address: http://0.0.0.0:4000/
  Server running... press ctrl-c to stop.
```

To develop the website, launch the container using the following command, where the source files are mounted into the container:

```bash
docker run --rm -it -p 4000:4000 \
    -u $(id -u):$(id -g) \
    -v $(pwd):/srv/jekyll:Z \
    us-rse-website:latest
```

or, if using Podman in a rootless environment:

```bash
podman run --rm -it -p 4000:4000 \
    --userns=keep-id \
    -v $(pwd):/srv/jekyll:Z \
    us-rse-website:latest
```

If these commands fail with Ruby/Jekyll errors, remove your local copy of `Gemfile.lock` with `rm Gemfile.lock` and try again.  If these commands fail with permission errors, you may need to address discrepancies between the user/group mapping in your container runtime and the permissions on the directory where the volume mount resides.

Edit a source file and save the changes. You will see Jekyll automatically regenerate the site, after which you can reload the page in your browser to see the rendered changes.

