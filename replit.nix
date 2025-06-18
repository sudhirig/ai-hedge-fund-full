{ pkgs }: {
  deps = [
    pkgs.python310
    pkgs.poetry
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.yarn
  ];
}
