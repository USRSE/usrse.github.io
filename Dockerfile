FROM jekyll/jekyll:3.8
## Currently jekyll/jekyll:4 fails with the error below so tag 3.8 is used instead.
#      Dockerfile:10
#      --------------------
#         8 |     ## Install required gems
#         9 |     COPY ./Gemfile ./Gemfile
#        10 | >>> RUN bundle install
#        11 |     
#        12 |     ## Copy source files
#      --------------------
#      ERROR: failed to solve: process "/bin/sh -c bundle install" 
#             did not complete successfully: exit code: 5

ENV JEKYLL_UID=1000
ENV JEKYLL_GID=1000

USER ${JEKYLL_UID}

## Install required gems
COPY ./Gemfile ./Gemfile
RUN bundle install

## Copy source files
COPY --chown=${JEKYLL_UID}:${JEKYLL_GID} ./ ./

CMD ["bundle", "exec", "jekyll", "serve", "--host=0.0.0.0", "--watch", "--drafts"]
