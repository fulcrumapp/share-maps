data-shares
===========

A responsive web mapping application for viewing [Fulcrum Data Shares](http://fulcrumapp.com/manual/data-shares/).

### Demo:
http://bmcbride.github.io/data-shares/?id=b711f907a8d42665&title=Surveillance%20Cameras&logo=http://fulcrumapp.com/assets/img/icons/apple-touch-icon.png&title_field=Description&fields=Status,Description,Model%20of%20camera,Coverage%20photos%20Url,Platform%20type,Platform%20height,Platform%20photos%20Url

### URL Parameters:

| Parameter     | Default       | Description                                              | Required |
| ------------- | ------------- | -------------------------------------------------------- | -------- |
| _id_          |               | Data share access token                                  | True     |
| _title_       | Fulcrum Data  | Navbar, app title                                        | False    |
| _logo_        |               | URL to a custom navbar logo                              | False    |
| _title_field_ | Fulcrum Id    | Field used for marker/sidebar title, use the field label | False    |
| _fields_      | All           | Comma separated list of specific fields to show          | False    |
