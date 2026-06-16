## 🤔 Arrestive Curiosity & RSEs: How to Turn the Shiny Toy Syndrome Bug into a Feature 🤔

<a name="headline"></a>

This month, I had the pleasure of meeting some fellow R users at the Boston R User Group meetup,
where I can say I finally felt safe opening a conversation with a hot take like, "R is the best," knowing
it would likely not spark a flame war. I'm sure many of you having read that sentence
are already compiling the several counterarguments in your head, mashing away your response
in a text editor, choosing all your best and worst use cases as examples and calling on the
greats of your respective community to back you up. But this discussion is actually not about flame wars;
in fact, as I'm sure you've experienced, we as technologists often care less about what tool
is objectively best, and more about what tool is best for us, our project, and our team.

And while this can sound like a freeing stance on tooling in general, it leaves us with
an acute conundrum: how do we know when to _switch_ tools? When do we know that the tool we're
using is no longer best for us, and that we should switch to something else? As computing becomes
more accessible and capable, more individuals are building tools that avow to _finally_ and
_decisively_ solve the problem of [insert other tools' shortcomings here]. Indeed, whether it
was Markdown's attempt to become the de facto standard for writing on the web
Anaconda claim to be the last word in environment management for data science, or the
eternal paradox of Apple's latest OS somehow always having "the best feature, ever," 
technology is rife with shiny toys that promise to solve all our problems. On the one hand, it can be
incredibly overwhelming trying to keep up with the latest and greatest, and on the other,
you could easily risk missing out on a tool that could be a game changer for you and your team if
you don't branch out and experiment from time to time[1^].

This decision fatigue can end up being a significant job hazard for people who work with technology.
What if your organization is one of the unfortunate few that decided to go all-in on Skype[2^],
or what if you can't ship a new product or publish a paper because your team has not ported
over its legacy libraries to Python 3 yet? As RSEs, part of our responsibility is to help
scientific teams navigate this ever-changing landscape of tools and technologies, and it can
be very tricky to draw the line between productive experimentation and [shiny toy syndrome](https://nesslabs.com/shiny-toy-syndrome).
How does one justify several afternoons' worth of tinkering, only to come to the conclusion
that the new tool actually _doesn't_ do what it says on the box - or at least, not to your satisfaction —
and continue to be trusted with the responsibility of guiding your team's technological vision?

But as I thought about this more, I realized that this activity of tinkering and experimenting 
with new tools is actually a critical part of our job as RSEs, and that we can turn this "bug" 
of shiny toy syndrome into a "feature" of arrestive curiosity. Arrestive curiosity is the 
tendency to be so curious about new tools and technologies that you cannot move forward with your 
own work until you've proven a new tool is either better or worse for you than the one 
you're currently using[3^]. If you've ever been up late at night trying to get a VSCode extension to
run without error, trying to figure out why a new library can't just install on your system,
or drawing out your ultimate note-taking entourage of apps for never losing a thought, I see you!
This kind of curiosity can be a disastrous time sink — but it can also be a powerful way to
stay on top of the latest and greatest, and to make sure you're using the best tools for you and your team. 

So, how do we cultivate arrestive curiosity without falling into the trap of 
time-wasting? Having wrestled with this for several years, I think I can provide a few
considerations that have helped me strike this balance:

1. _Stop being distracted by the perfect tool until you know what perfect is supposed to look like._ 
Before seriously investigating a new tool, write down exactly
what problem or need you think it is trying to solve for you. In the simple process of
articulating this, you may find that your existing workflow just needs some refinement,
or a simple adjustment or reframing of the problem. 95% of the time, my tinkering does not
pass this step.

2. _Get comfortable with the discomfort of your current tools._ If you've successfully passed
the first step, then you know for a fact that your current workflow needs are not being met,
and a new tool — or repurposing an old one — is likely the solution. But before you dive into the new tool, 
now is the time to measure the discomfort of your current workflow. How much time are you losing to this 
problem? How much mental energy are you spending on it? How much is it costing your team in 
productivity and morale? If the cost of your current workflow is not high enough, then it may 
not be worth the time and effort to switch to a new tool. If you can tolerate the discomfort, then the tool search ends here.

3. _Refine to absurdum._ If you are still convinced that something is missing, then it is time to start
looking for what is missing. Surely someone has felt this acute pain, right? The internet is a vast place,
and there are several billion of us using it at any given time. It's more than likely that someone,
somewhere, has been in the exact position you're in, with an install that is too slow, a link that
doesn't work, or a workflow that is too clunky and just missing that, _secret something_. Go out into dark
corners of the second, third, and fourth pages of Google search, ask around on Reddit and Facebook groups, or
find forums and communities that are relevant to the problem space. Surely **someone** has faced this problem, too?

4. If the solution is identified, use it. If not, build it. By this point, if you have found a
niche problem that 1) arrests your productivity, 2) causes measurable discomfort, and 3) has not been
solved by anyone else, then this is a problem worth solving. In fact, as an RSE, this is the _perfect_
problem to have, because it is within this narrow gap between your vision and the status quo that 
you can actually make valuable impact to your team. If you can't or don't want to build the solution yourself,
one of two things must be true: either the problem is not worth solving, or you are _not yet_ the right person to solve it.

In my experience, the really interesting Research Software Engineering is what happens when as an
engineer I have become _obsessed_ with a particular technological blocker to the success of my or my colleagues' scientific endeavors. 

It is the moment we look at the scientific engine and say, "I know we _could_ just use [X Tool] to write
this part of the paper, but I just can't accept that this is the best way to do it. I simply can't. There
_must_ be a better way."

This is the "arrestive," part of "arrestive curiosity" — the part that keeps you up at night,
ceases you in your tracks every time you think about it, and continues to consume all of your mental
energy until you have either found a solution or come to terms with the fact that there is no solution.

And if you ask me, that tendency to be obsessed with finding the best way to do science is what makes a good 
RSE a _great_ RSE. So, the next time you find yourself in the throes of shiny toy syndrome, try to 
channel that energy into arrestive curiosity using the flowchart I outlined above, and see where it takes you. 
You might just find that the perfect tool was right in front of you all along, or you might end up building 
something that changes the game for you, your team, and perhaps even the science itself.

[1^]: In fact, at this UseR Boston meetup, we ourselves had a hard time rectifying our excitement
vs. hesitation around all things AI in the R world. We could barely come to a consensus on
whether we could be convinced to switch over to the new native pipe `|>` or stick with the beloved 
`magrittr` pipe `%>%` that we've been using for years, all the while doing our best "old man yells at cloud" impression.
Spoiler alert: I'm yelling at the cloud.
[2^]: Shout out to everyone currently being held hostage by their CTO's contract with Microsoft and having to wake
up every morning to the sound of a Teams notification. We see you, and we feel your pain.
[3^]: Yes, I just came up with it. No, I will not be answering questions.

------------------------------------------------------------------------