# Containers

```d2
server
# Declares a shape inside of another shape
server.process

# Can declare the container and child in same line
im a parent.im a child

# Since connections can also declare keys, this works too
apartment.Bedroom.Bathroom -> office.Spare Room.Bathroom: Portal
```

## Nested syntax

You can avoid repeating containers by creating nested maps.

```d2
clouds: {
  aws: {
    load_balancer -> api
    api -> db
  }
  gcloud: {
    auth -> db
  }

  gcloud -> aws
}
```

## Container labels

There are two ways define container labels.

### 1. Shorthand container labels

```d2-incomplete
gcloud: Google Cloud {
  ...
}
```

### 2. Reserved keyword `label`

```d2-incomplete
gcloud: {
  label: Google Cloud
  ...
}
```

## Example

```d2
clouds: {
  aws: AWS {
    load_balancer -> api
    api -> db
  }
  gcloud: Google Cloud {
    auth -> db
  }

  gcloud -> aws
}

users -> clouds.aws.load_balancer
users -> clouds.gcloud.auth

ci.deploys -> clouds
```

## Reference parent

Sometimes you want to reference something outside of the container from within. The
underscore (`_`) refers to parent.

```d2
christmas: {
  presents
}
birthdays: {
  presents
  _.christmas.presents -> presents: regift
  _.christmas.style.fill: "#ACE1AF"
}
```
