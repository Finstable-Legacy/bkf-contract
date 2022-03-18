// SPDX-License-Identifier: MIT AND Unlicense
// Sources flattened with hardhat v2.9.1 https://hardhat.org

pragma solidity ^0.8.0;

abstract contract Committee {
  address public committee;

  event CommitteeSet(
    address indexed oldCommittee,
    address indexed newCommittee,
    address indexed caller
  );

  modifier onlyCommittee() {
    require(msg.sender == committee, "Committee: restricted only committee");
    _;
  }

  function setCommittee(address _committee) public virtual onlyCommittee {
    emit CommitteeSet(committee, _committee, msg.sender);
    committee = _committee;
  }
}
