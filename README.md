share-maps
===========

A responsive web mapping application for viewing [Fulcrum Data Shares](http://fulcrumapp.com/manual/data-shares/).

### Tampa Surveillance Cameras Demo:
http://fulcrumapp.github.io/share-maps/?id=b711f907a8d42665&title=Surveillance%20Cameras&logo=http://bmcbride.github.io/fulcrum-examples/geoint-cctv/assets/img/cctv-complete.png&title_field=Description&fields=Status,Description,Model%20of%20camera,Coverage%20photos%20Url,Platform%20type,Platform%20height,Platform%20photos%20Url

### Fulcrum Dispatches Demo:
http://fulcrumapp.github.io/share-maps/?id=136e85ea80aa6d48&title=Fulcrum%20Dispatches&logo=http://fulcrumapp.com/assets/img/icons/apple-touch-icon.png&title_field=Title&fields=Date,Event,Title,Author,Description,Photos%20Url,Videos%20Url

### URL Parameters:

| Parameter     | Default       | Description                                              | Required |
| ------------- | ------------- | -------------------------------------------------------- | -------- |
| _id_          |               | Data share access token                                  | True     |
| _title_       | Fulcrum Data  | Navbar, app title                                        | False    |
| _logo_        |               | URL to a custom navbar logo                              | False    |
| _title_field_ | Fulcrum Id    | Field used for marker/sidebar title, use the field label | False    |
| _fields_      | All           | Comma separated list of specific fields to show          | False    |
