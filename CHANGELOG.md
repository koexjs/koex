# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.12.1](https://github.com/koexjs/koex/compare/v0.12.0...v0.12.1) (2020-07-18)


### Bug Fixes

* **@koex/passport:** fix passport deserializeUser maybe 401 when get user from other service ([af222c3](https://github.com/koexjs/koex/commit/af222c3d4ed72ae0e0286b574a306c5f1fa1d5c7))





# 0.12.0 (2020-07-14)


### Bug Fixes

* **body:** emmm ts bad ([051800d](https://github.com/koexjs/koex/commit/051800d53c886893fe07f833b6b939e320148d6a))
* **body:** emmm ts bad ([fc92d67](https://github.com/koexjs/koex/commit/fc92d677a73354cf7bf14cdfddd3782dee8637cd))
* **body:** fix body dev dependency ([7046a1d](https://github.com/koexjs/koex/commit/7046a1d55c53ef3c33890bd0b9421bb2bbefd375))


### Features

* **body:** move @koex/body in lerna ([f39944f](https://github.com/koexjs/koex/commit/f39944f3ce69ca720af96378429f16b8357eac8a))





## [0.11.1](https://github.com/koexjs/koex/compare/v0.11.0...v0.11.1) (2020-07-14)

**Note:** Version bump only for package root





# [0.11.0](https://github.com/koexjs/koex/compare/v0.10.2...v0.11.0) (2020-07-14)


### Features

* **core:** export type Request and Response for custom, because koa cannot extend Request nest ([ea3d210](https://github.com/koexjs/koex/commit/ea3d210fba61adee862c7267a6761f3b0a0d2d0f))





## [0.10.2](https://github.com/koexjs/koex/compare/v0.10.1...v0.10.2) (2020-07-07)


### Bug Fixes

* **@koex/passport:** show correct error in url when token_url or user_info_url throw error ([9688ccd](https://github.com/koexjs/koex/commit/9688ccdf9e953ce3c7ac61c6d5fbedcd2db2c443))





## [0.10.1](https://github.com/koexjs/koex/compare/v0.10.0...v0.10.1) (2020-07-04)

**Note:** Version bump only for package root





# [0.10.0](https://github.com/koexjs/koex/compare/v0.9.0...v0.10.0) (2020-07-04)


### Bug Fixes

* **@koex/serve:** fix show hidden files and directory ([7a4b376](https://github.com/koexjs/koex/commit/7a4b37615854bf39be32b643364d0ceb98ba5f5a))


### Features

* **@koex/static:** support showHidden option ([d81e3dd](https://github.com/koexjs/koex/commit/d81e3dd608a41493631c7c365ea733b37c9a02ad))





# [0.9.0](https://github.com/koexjs/koex/compare/v0.8.0...v0.9.0) (2020-07-03)


### Features

* **@koex/serve:** support qrcode in terminal, better for mobile ([3eb0a66](https://github.com/koexjs/koex/commit/3eb0a66f2409853d7dd8b3946eb357567b13df8a))





# [0.8.0](https://github.com/koexjs/koex/compare/v0.7.0...v0.8.0) (2020-07-03)


### Bug Fixes

* **@koex/serve:** fix not found file error by stat exception ([fb97fb5](https://github.com/koexjs/koex/commit/fb97fb5b2a7f44de4001395116b611c7917e7194))


### Features

* **@koex/serve:** support suffix with -S, --suffix json,yml, which is to try files with suffix ([a6941c3](https://github.com/koexjs/koex/commit/a6941c3ab9e557226d02b674987c95d5ae390ee6))
* **@koex/static:** support suffix to try file with suffix ([8e41699](https://github.com/koexjs/koex/commit/8e41699a014bb48da4ad97813ef53cf2e33dd6d0))





# [0.7.0](https://github.com/koexjs/koex/compare/v0.6.0...v0.7.0) (2020-07-03)


### Features

* **@koex/serve:** add @koex/serve for koex-serve or serve commandline tool ([8546746](https://github.com/koexjs/koex/commit/854674669d0a713d634bf812c78b43fdf37266aa))
* **@koex/static:** support index interface to open index mode and set index file ([586b04b](https://github.com/koexjs/koex/commit/586b04b1324d8d9945d9e51ded0a6154a2ee2a68))





# [0.6.0](https://github.com/koexjs/koex/compare/v0.5.2...v0.6.0) (2020-06-28)


### Features

* **@koex/core:** support createServices ([f65c474](https://github.com/koexjs/koex/commit/f65c474d3b9741d2a4da7ab49098dc9a8c611ffe))
* **@koex/core:** support extendsApplication and extendsContext ([a17a887](https://github.com/koexjs/koex/commit/a17a887c0bfaca16e1a31cd21a96add990aac0e2))





## [0.5.2](https://github.com/koexjs/koex/compare/v0.5.1...v0.5.2) (2020-06-26)

**Note:** Version bump only for package root





## [0.5.1](https://github.com/koexjs/koex/compare/v0.5.0...v0.5.1) (2020-06-26)


### Bug Fixes

* **core:** fix core should not dirty global Controller and Service, which make bugs when many requests in ([aa60823](https://github.com/koexjs/koex/commit/aa60823f3f1e5cc79036b91cf68e4dcb8f037d98))





# [0.5.0](https://github.com/koexjs/koex/compare/v0.4.0...v0.5.0) (2020-06-25)


### Bug Fixes

* **@koex/core:** add appLogger(app.logger) and contextLogger(ctx.logger) ([09b618b](https://github.com/koexjs/koex/commit/09b618b401e2402124cf74773537d5c833adbb06))


### Features

* **@koex/core:** add appCache(app.cache) and contextCache(ctx.cache) ([7978141](https://github.com/koexjs/koex/commit/79781414f8972cbf4e0353c35cdccb0f62f57a75))





# [0.4.0](https://github.com/koexjs/koex/compare/v0.3.2...v0.4.0) (2020-06-25)


### Features

* **@koex/core:** add appLogger(app.logger) and contextLogger(ctx.logger) ([7c0a04d](https://github.com/koexjs/koex/commit/7c0a04d6fc35bc9341a8df53dc4e746c135d8b0b))
* **@koex/core:** add ctx.logger ([0f2c8f7](https://github.com/koexjs/koex/commit/0f2c8f7b8ceec1d600b1a2871fb0e4da9a62b5c8))
* **@koex/core:** add ctx.logger by [@zodash](https://github.com/zodash).logger ([978eda7](https://github.com/koexjs/koex/commit/978eda711b82b5bec93a002259d00661887c3768))





## [0.3.2](https://github.com/koexjs/koex/compare/v0.3.1...v0.3.2) (2020-06-25)

**Note:** Version bump only for package root





## 0.3.1 (2020-06-25)

**Note:** Version bump only for package root





# [0.3.0](https://github.com/koexjs/koex/compare/v0.2.0...v0.3.0) (2020-06-25)


### Bug Fixes

* fix test ([b0afe9b](https://github.com/koexjs/koex/commit/b0afe9b671800cc33776e294586e0f5fb4c13140))


### Features

* **@koex/core:** support Controller and Service base class ([811bf9d](https://github.com/koexjs/koex/commit/811bf9d0ae305160078791e114f9bc107c5f4a0e))
* **@koex/passport:** use /login/:strategy(/callback) as default instead of /oauth/:strategy(/callback) ([91d643d](https://github.com/koexjs/koex/commit/91d643dada97ce4a3412cfbe8dc68664787b1a06))





# [0.2.0](https://github.com/koexjs/koex/compare/v0.1.0...v0.2.0) (2020-04-28)


### Features

* **passport:** export serializeUser and deserializeUser the ctx ([5890b5e](https://github.com/koexjs/koex/commit/5890b5ed64c27ac2c01dbd4f235f04cf640f632c))





# 0.1.0 (2020-04-27)


### Features

* **passport:** refactor passport inspired by passportjs ([0696f75](https://github.com/koexjs/koex/commit/0696f75b7d025a1141efdcc536a48d433e2d1749))





## [0.0.29](https://github.com/koexjs/koex/compare/v0.0.28...v0.0.29) (2019-12-27)

**Note:** Version bump only for package root





## [0.0.28](https://github.com/koexjs/koex/compare/v0.0.27...v0.0.28) (2019-12-25)

**Note:** Version bump only for package root





## [0.0.27](https://github.com/koexjs/koex/compare/v0.0.26...v0.0.27) (2019-12-25)

**Note:** Version bump only for package root





## 0.0.26 (2019-12-25)

**Note:** Version bump only for package root





## [0.0.25](https://github.com/koexjs/koex/compare/v0.0.24...v0.0.25) (2019-12-01)

**Note:** Version bump only for package root





## [0.0.24](https://github.com/koexjs/koex/compare/v0.0.23...v0.0.24) (2019-11-27)

**Note:** Version bump only for package root





## [0.0.23](https://github.com/koexjs/koex/compare/v0.0.22...v0.0.23) (2019-11-27)

**Note:** Version bump only for package root





## [0.0.22](https://github.com/koexjs/koex/compare/v0.0.21...v0.0.22) (2019-11-23)

**Note:** Version bump only for package root





## [0.0.21](https://github.com/koexjs/koex/compare/v0.0.20...v0.0.21) (2019-11-23)

**Note:** Version bump only for package root





## [0.0.20](https://github.com/koexjs/koex/compare/v0.0.19...v0.0.20) (2019-10-28)

**Note:** Version bump only for package root





## [0.0.19](https://github.com/koexjs/koex/compare/v0.0.18...v0.0.19) (2019-10-25)

**Note:** Version bump only for package root





## [0.0.18](https://github.com/koexjs/koex/compare/v0.0.17...v0.0.18) (2019-10-25)

**Note:** Version bump only for package root





## [0.0.17](https://github.com/koexjs/koex/compare/v0.0.16...v0.0.17) (2019-10-25)

**Note:** Version bump only for package root





## [0.0.16](https://github.com/koexjs/koex/compare/v0.0.15...v0.0.16) (2019-10-25)

**Note:** Version bump only for package root





## [0.0.15](https://github.com/koexjs/koex/compare/v0.0.14...v0.0.15) (2019-10-24)

**Note:** Version bump only for package root





## [0.0.14](https://github.com/koexjs/koex/compare/v0.0.13...v0.0.14) (2019-10-24)

**Note:** Version bump only for package root





## [0.0.13](https://github.com/koexjs/koex/compare/v0.0.12...v0.0.13) (2019-10-24)

**Note:** Version bump only for package root





## [0.0.12](https://github.com/koexjs/koex/compare/v0.0.11...v0.0.12) (2019-10-23)

**Note:** Version bump only for package root





## 0.0.11 (2019-10-23)

**Note:** Version bump only for package root





## [0.0.10](https://github.com/koexjs/koex/compare/v0.0.9...v0.0.10) (2019-10-23)

**Note:** Version bump only for package root





## 0.0.9 (2019-10-23)

**Note:** Version bump only for package root





## [0.0.8](https://github.com/koexjs/koex/compare/v0.0.7...v0.0.8) (2019-10-22)

**Note:** Version bump only for package root





## [0.0.7](https://github.com/koexjs/koex/compare/v0.0.6...v0.0.7) (2019-09-22)

**Note:** Version bump only for package root





## [0.0.6](https://github.com/koexjs/koex/compare/v0.0.5...v0.0.6) (2019-09-19)

**Note:** Version bump only for package root





## [0.0.5](https://github.com/koexjs/koex/compare/v0.0.4...v0.0.5) (2019-09-18)

**Note:** Version bump only for package root





## [0.0.4](https://github.com/koexjs/koex/compare/v0.0.3...v0.0.4) (2019-09-18)

**Note:** Version bump only for package root





## [0.0.3](https://github.com/koexjs/koex/compare/v0.0.2...v0.0.3) (2019-09-17)

**Note:** Version bump only for package root





## [0.0.2](https://github.com/koexjs/koex/compare/v0.0.1...v0.0.2) (2019-09-17)

**Note:** Version bump only for package root





## 0.0.1 (2019-09-16)

**Note:** Version bump only for package root
