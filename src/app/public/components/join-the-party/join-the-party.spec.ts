import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinTheParty } from './join-the-party';

describe('JoinTheParty', () => {
  let component: JoinTheParty;
  let fixture: ComponentFixture<JoinTheParty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinTheParty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinTheParty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
