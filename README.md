orient
======

UNDER CONSTRUCTION

commands to set it up on heroku:

```
heroku apps:create orient
heroku addons:add mongohq:sandbox

heroku config:set SESSION_SECRET=change_me

git push heroku master
```
