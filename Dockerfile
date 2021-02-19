FROM jekyll/jekyll

COPY Gemfile .

RUN bundle install --quiet --clean

CMD ["jekyll", "serve"]
