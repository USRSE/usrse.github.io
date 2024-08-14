FROM jekyll/jekyll:stable

ENV JEKYLL_UID=1000
ENV JEKYLL_GID=1000

## Install required gems
COPY ./Gemfile ./Gemfile
RUN bundle install

USER ${JEKYLL_UID}

## Copy source files
COPY --chown=${JEKYLL_UID}:${JEKYLL_GID} ./ ./

CMD ["bundle", "exec", "jekyll", "serve", "--host=0.0.0.0", "--watch", "--drafts"]
